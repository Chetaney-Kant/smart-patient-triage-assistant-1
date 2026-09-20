package com.healthcare.triage.clinician;

import com.healthcare.triage.auth.User;
import com.healthcare.triage.auth.UserRepository;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.common.UserRole;
import com.healthcare.triage.intake.TriageSession;
import com.healthcare.triage.intake.TriageSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicianAllotmentService {

    private final UserRepository userRepository;
    private final TriageSessionRepository sessionRepository;

    private static final List<TriageState> ACTIVE_LOAD_STATES = List.of(
            TriageState.EMERGENCY_DECLARED,
            TriageState.URGENT_TRIAGED,
            TriageState.CONFLICT_DETECTED,
            TriageState.INSUFFICIENT_INFO_FLAGGED,
            TriageState.AWAITING_CLINICIAN_REVIEW,
            TriageState.ROUTINE_TRIAGED,
            TriageState.CLINICIAN_OVERRIDDEN,
            TriageState.CLINICIAN_ACCEPTED
    );

    /**
     * Intelligently selects and assigns an available clinician whose specialization/department
     * matches the patient's triage needs and has the lowest active patient caseload.
     */
    @Transactional
    public User allotClinician(TriageSession session, String suggestedDepartment) {
        String targetDepartment = resolveDepartment(session, suggestedDepartment);

        List<User> availableDoctors = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ROLE_CLINICIAN && u.isActive())
                .filter(u -> !"OFF_DUTY".equalsIgnoreCase(u.getAvailabilityStatus()))
                .toList();

        if (availableDoctors.isEmpty()) {
            log.warn("No active/on-duty clinicians found in hospital directory for auto-allotment.");
            return null;
        }

        // 1. Try matching by department / field
        List<User> specialistCandidates = availableDoctors.stream()
                .filter(u -> u.getDepartment() != null &&
                        (u.getDepartment().equalsIgnoreCase(targetDepartment) ||
                         targetDepartment.toLowerCase().contains(u.getDepartment().toLowerCase()) ||
                         u.getDepartment().toLowerCase().contains(targetDepartment.toLowerCase())))
                .toList();

        List<User> candidatePool = !specialistCandidates.isEmpty() ? specialistCandidates : availableDoctors;

        // 2. Select doctor with lowest active caseload (least busy free doctor)
        User bestDoctor = null;
        long lowestLoad = Long.MAX_VALUE;

        for (User doc : candidatePool) {
            long activeCases = sessionRepository.countByAssignedClinicianIdAndStatusIn(doc.getId(), ACTIVE_LOAD_STATES);
            // Give preference to "AVAILABLE" over "BUSY"
            long loadScore = activeCases + ("AVAILABLE".equalsIgnoreCase(doc.getAvailabilityStatus()) ? 0 : 5);
            if (loadScore < lowestLoad) {
                lowestLoad = loadScore;
                bestDoctor = doc;
            }
        }

        if (bestDoctor != null) {
            session.setAssignedClinician(bestDoctor);
            log.info("Auto-allotted triage case [{}] to Dr. {} (Dept: {}) [Current active caseload: {}]",
                    session.getSessionCode(), bestDoctor.getFullName(), bestDoctor.getDepartment(), lowestLoad);
        }

        return bestDoctor;
    }

    private String resolveDepartment(TriageSession session, String suggested) {
        String symptom = session.getPrimarySymptom() != null ? session.getPrimarySymptom().toLowerCase() : "";
        String location = session.getBodyLocation() != null ? session.getBodyLocation().toLowerCase() : "";
        String raw = session.getRawSymptomsText() != null ? session.getRawSymptomsText().toLowerCase() : "";
        String combined = symptom + " " + location + " " + raw;

        if (combined.contains("breath") || combined.contains("cough") || combined.contains("lung") || combined.contains("wheez") || combined.contains("asthma") || combined.contains("respirat") || combined.contains("spo2") || combined.contains("chok")) {
            return "Pulmonology";
        } else if (combined.contains("chest") || combined.contains("heart") || combined.contains("cardio") || combined.contains("palpitation") || combined.contains("coronary") || combined.contains("angina")) {
            return "Cardiology";
        } else if (combined.contains("abdom") || combined.contains("stomach") || combined.contains("belly") || combined.contains("nausea") || combined.contains("vomit") || combined.contains("appendix") || combined.contains("gastro") || combined.contains("bowel")) {
            return "Gastroenterology";
        } else if (combined.contains("head") || combined.contains("speech") || combined.contains("slur") || combined.contains("droop") || combined.contains("weakness") || combined.contains("dizzi") || combined.contains("neuro") || combined.contains("stroke") || combined.contains("numb") || combined.contains("seizure") || combined.contains("paraly")) {
            return "Neurology";
        } else if (combined.contains("rash") || combined.contains("allergy") || combined.contains("itch") || combined.contains("anaph") || combined.contains("hives")) {
            return "Allergy & Immunology";
        } else if (combined.contains("bone") || combined.contains("fracture") || combined.contains("joint") || combined.contains("sprain") || combined.contains("back pain")) {
            return "Orthopedics";
        }

        if (suggested != null && !suggested.trim().isBlank()) {
            return suggested.trim();
        }
        return "General Medicine / Emergency";
    }
}
