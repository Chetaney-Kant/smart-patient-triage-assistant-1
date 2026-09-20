package com.healthcare.triage.admin;

import com.healthcare.triage.ai.AiServiceFactory;
import com.healthcare.triage.audit.AuditLog;
import com.healthcare.triage.audit.AuditLogService;
import com.healthcare.triage.auth.UserRepository;
import com.healthcare.triage.clinician.ClinicianReviewRepository;
import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.common.UserRole;
import com.healthcare.triage.emergency.EmergencyIncidentRepository;
import com.healthcare.triage.intake.TriageSessionRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final TriageSessionRepository sessionRepository;
    private final ClinicianReviewRepository reviewRepository;
    private final EmergencyIncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AiServiceFactory aiServiceFactory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HospitalAnalyticsReport {
        private long totalPatients;
        private long totalClinicians;
        private long totalTriageSessions;
        private long emergencyCases;
        private long urgentCases;
        private long normalCases;
        private long insufficientInfoCases;
        private long activeIncidents;
        private long clinicianOverrides;
        private long clinicianAcceptances;
        private double aiAgreementRatePercentage;
        private boolean aiEnabled;
        private String activeAiProvider;
        private Map<String, Long> statusBreakdown;
        private List<AuditLog> recentAuditLogs;
    }

    @Transactional(readOnly = true)
    public HospitalAnalyticsReport getHospitalAnalytics() {
        long totalPatients = userRepository.countByRole(UserRole.ROLE_PATIENT);
        long totalClinicians = userRepository.countByRole(UserRole.ROLE_CLINICIAN);
        long totalSessions = sessionRepository.count();

        long emergency = sessionRepository.countByFinalPriority(TriagePriority.EMERGENCY);
        long urgent = sessionRepository.countByFinalPriority(TriagePriority.URGENT);
        long normal = sessionRepository.countByFinalPriority(TriagePriority.NORMAL);
        long insufficient = sessionRepository.countByFinalPriority(TriagePriority.INSUFFICIENT_INFO);

        long activeIncidents = incidentRepository.findByStatusOrderByDispatchTimestampDesc("DISPATCHED").size();
        long overrides = reviewRepository.countByActionType("OVERRIDE");
        long accepts = reviewRepository.countByActionType("ACCEPT");

        long totalReviews = overrides + accepts;
        double agreementRate = (totalReviews > 0) ?
                Math.round(((double) accepts / totalReviews) * 1000.0) / 10.0 : 100.0;

        Map<String, Long> statusBreakdown = new HashMap<>();
        for (TriageState state : TriageState.values()) {
            long count = sessionRepository.countByStatus(state);
            if (count > 0) {
                statusBreakdown.put(state.name(), count);
            }
        }

        List<AuditLog> auditLogs = auditLogService.getRecentAuditLogs();

        return HospitalAnalyticsReport.builder()
                .totalPatients(totalPatients)
                .totalClinicians(totalClinicians)
                .totalTriageSessions(totalSessions)
                .emergencyCases(emergency)
                .urgentCases(urgent)
                .normalCases(normal)
                .insufficientInfoCases(insufficient)
                .activeIncidents(activeIncidents)
                .clinicianOverrides(overrides)
                .clinicianAcceptances(accepts)
                .aiAgreementRatePercentage(agreementRate)
                .aiEnabled(aiServiceFactory.isAiEnabled())
                .activeAiProvider(aiServiceFactory.getActiveProvider().getProviderName())
                .statusBreakdown(statusBreakdown)
                .recentAuditLogs(auditLogs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.triage.admin.dto.DoctorDto> getAllDoctors() {
        List<TriageState> activeStates = List.of(
                TriageState.EMERGENCY_DECLARED,
                TriageState.URGENT_TRIAGED,
                TriageState.CONFLICT_DETECTED,
                TriageState.INSUFFICIENT_INFO_FLAGGED,
                TriageState.AWAITING_CLINICIAN_REVIEW,
                TriageState.ROUTINE_TRIAGED,
                TriageState.CLINICIAN_OVERRIDDEN,
                TriageState.CLINICIAN_ACCEPTED
        );

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ROLE_CLINICIAN && u.isActive())
                .map(u -> {
                    long activeCases = sessionRepository.countByAssignedClinicianIdAndStatusIn(u.getId(), activeStates);
                    return com.healthcare.triage.admin.dto.DoctorDto.builder()
                            .id(u.getId())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .phone(u.getPhone())
                            .department(u.getDepartment() != null ? u.getDepartment() : "General Medicine")
                            .specialization(u.getSpecialization() != null ? u.getSpecialization() : "General Physician")
                            .availabilityStatus(u.getAvailabilityStatus() != null ? u.getAvailabilityStatus() : "AVAILABLE")
                            .activeCasesCount(activeCases)
                            .active(u.isActive())
                            .build();
                })
                .toList();
    }

    @Transactional
    public com.healthcare.triage.admin.dto.DoctorDto createDoctor(com.healthcare.triage.admin.dto.CreateDoctorRequest req, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new com.healthcare.triage.common.ValidationException("Doctor with email " + req.getEmail() + " already exists.");
        }

        com.healthcare.triage.auth.User doctor = com.healthcare.triage.auth.User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .department(req.getDepartment())
                .specialization(req.getSpecialization() != null && !req.getSpecialization().isBlank() ? req.getSpecialization() : req.getDepartment() + " Specialist")
                .role(UserRole.ROLE_CLINICIAN)
                .availabilityStatus("AVAILABLE")
                .active(true)
                .build();

        com.healthcare.triage.auth.User saved = userRepository.save(doctor);
        return com.healthcare.triage.admin.dto.DoctorDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .department(saved.getDepartment())
                .specialization(saved.getSpecialization())
                .availabilityStatus(saved.getAvailabilityStatus())
                .activeCasesCount(0)
                .active(saved.isActive())
                .build();
    }

    @Transactional
    public com.healthcare.triage.admin.dto.DoctorDto updateDoctor(Long doctorId, com.healthcare.triage.admin.dto.UpdateDoctorRequest req, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        com.healthcare.triage.auth.User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new com.healthcare.triage.common.ResourceNotFoundException("Doctor", "id", doctorId));

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            doctor.setFullName(req.getFullName().trim());
        }
        if (req.getPhone() != null) {
            doctor.setPhone(req.getPhone().trim());
        }
        if (req.getDepartment() != null && !req.getDepartment().isBlank()) {
            doctor.setDepartment(req.getDepartment().trim());
        }
        if (req.getSpecialization() != null && !req.getSpecialization().isBlank()) {
            doctor.setSpecialization(req.getSpecialization().trim());
        }
        if (req.getAvailabilityStatus() != null && !req.getAvailabilityStatus().isBlank()) {
            doctor.setAvailabilityStatus(req.getAvailabilityStatus().toUpperCase().trim());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            doctor.setPasswordHash(passwordEncoder.encode(req.getPassword().trim()));
        }
        if (req.getActive() != null) {
            doctor.setActive(req.getActive());
        }

        com.healthcare.triage.auth.User updated = userRepository.save(doctor);

        List<TriageState> activeStates = List.of(
                TriageState.EMERGENCY_DECLARED,
                TriageState.URGENT_TRIAGED,
                TriageState.CONFLICT_DETECTED,
                TriageState.INSUFFICIENT_INFO_FLAGGED,
                TriageState.AWAITING_CLINICIAN_REVIEW,
                TriageState.ROUTINE_TRIAGED,
                TriageState.CLINICIAN_OVERRIDDEN,
                TriageState.CLINICIAN_ACCEPTED
        );
        long activeCases = sessionRepository.countByAssignedClinicianIdAndStatusIn(updated.getId(), activeStates);

        return com.healthcare.triage.admin.dto.DoctorDto.builder()
                .id(updated.getId())
                .fullName(updated.getFullName())
                .email(updated.getEmail())
                .phone(updated.getPhone())
                .department(updated.getDepartment())
                .specialization(updated.getSpecialization())
                .availabilityStatus(updated.getAvailabilityStatus())
                .activeCasesCount(activeCases)
                .active(updated.isActive())
                .build();
    }

    @Transactional
    public void deleteDoctor(Long doctorId) {
        com.healthcare.triage.auth.User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new com.healthcare.triage.common.ResourceNotFoundException("Doctor", "id", doctorId));

        // 1. Unassign all sessions assigned to this doctor
        List<com.healthcare.triage.intake.TriageSession> assignedSessions = sessionRepository.findByAssignedClinicianId(doctorId);
        for (com.healthcare.triage.intake.TriageSession session : assignedSessions) {
            session.setAssignedClinician(null);
            sessionRepository.save(session);
        }

        // 2. Check if doctor has historical reviews
        List<com.healthcare.triage.clinician.ClinicianReview> reviews = reviewRepository.findByClinicianIdOrderByReviewTimestampDesc(doctorId);
        if (reviews.isEmpty()) {
            userRepository.delete(doctor);
            log.info("Doctor #{} had no historical reviews and was completely removed.", doctorId);
        } else {
            doctor.setActive(false);
            doctor.setAvailabilityStatus("OFF_DUTY");
            userRepository.save(doctor);
            log.info("Doctor #{} has historical reviews. Soft-deleted and removed from active roster.", doctorId);
        }
    }

    @Transactional
    public com.healthcare.triage.admin.dto.DoctorDto updateDoctorStatus(Long doctorId, String newStatus) {
        com.healthcare.triage.auth.User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new com.healthcare.triage.common.ResourceNotFoundException("Doctor", "id", doctorId));
        doctor.setAvailabilityStatus(newStatus.toUpperCase());
        userRepository.save(doctor);

        List<TriageState> activeStates = List.of(
                TriageState.EMERGENCY_DECLARED,
                TriageState.URGENT_TRIAGED,
                TriageState.CONFLICT_DETECTED,
                TriageState.INSUFFICIENT_INFO_FLAGGED,
                TriageState.AWAITING_CLINICIAN_REVIEW,
                TriageState.ROUTINE_TRIAGED,
                TriageState.CLINICIAN_OVERRIDDEN,
                TriageState.CLINICIAN_ACCEPTED
        );
        long activeCases = sessionRepository.countByAssignedClinicianIdAndStatusIn(doctor.getId(), activeStates);

        return com.healthcare.triage.admin.dto.DoctorDto.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .department(doctor.getDepartment())
                .specialization(doctor.getSpecialization())
                .availabilityStatus(doctor.getAvailabilityStatus())
                .activeCasesCount(activeCases)
                .active(doctor.isActive())
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.healthcare.triage.admin.dto.AdminDto> getAllAdmins() {
        return userRepository.findByRole(UserRole.ROLE_ADMIN).stream()
                .map(admin -> com.healthcare.triage.admin.dto.AdminDto.builder()
                        .id(admin.getId())
                        .fullName(admin.getFullName())
                        .email(admin.getEmail())
                        .phone(admin.getPhone())
                        .active(admin.isActive())
                        .build())
                .toList();
    }

    @Transactional
    public com.healthcare.triage.admin.dto.AdminDto createAdmin(
            com.healthcare.triage.admin.dto.CreateAdminRequest req,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with email " + req.getEmail() + " already exists.");
        }

        com.healthcare.triage.auth.User admin = com.healthcare.triage.auth.User.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .role(UserRole.ROLE_ADMIN)
                .active(true)
                .build();

        com.healthcare.triage.auth.User saved = userRepository.save(admin);

        return com.healthcare.triage.admin.dto.AdminDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .active(saved.isActive())
                .build();
    }

    @Transactional
    public void deleteAdmin(Long adminId) {
        com.healthcare.triage.auth.User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new com.healthcare.triage.common.ResourceNotFoundException("Administrator", "id", adminId));

        if (userRepository.countByRole(UserRole.ROLE_ADMIN) <= 1) {
            throw new IllegalStateException("Cannot delete the only remaining Administrator account.");
        }

        userRepository.delete(admin);
        log.info("Administrator #{} removed successfully.", adminId);
    }
}
