package com.healthcare.triage.patient;

import com.healthcare.triage.auth.User;
import com.healthcare.triage.auth.UserRepository;
import com.healthcare.triage.common.ResourceNotFoundException;
import com.healthcare.triage.clinician.ClinicianReview;
import com.healthcare.triage.clinician.ClinicianReviewRepository;
import com.healthcare.triage.emergency.EmergencyIncidentRepository;
import com.healthcare.triage.intake.TriageSession;
import com.healthcare.triage.intake.TriageSessionRepository;
import com.healthcare.triage.patient.dto.PatientProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final PatientConditionRepository conditionRepository;
    private final PatientAllergyRepository allergyRepository;
    private final PatientMedicationRepository medicationRepository;
    private final PatientEmergencyContactRepository emergencyContactRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final TriageSessionRepository triageSessionRepository;
    private final ClinicianReviewRepository clinicianReviewRepository;
    private final EmergencyIncidentRepository emergencyIncidentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PatientProfileDto getProfileByUserId(Long userId) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public PatientProfileDto getProfileById(Long profileId) {
        PatientProfile profile = patientProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "id", profileId));
        return mapToDto(profile);
    }

    @Transactional
    public PatientProfileDto updateProfile(Long userId, PatientProfileDto dto) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));

        if (dto.getDateOfBirth() != null) profile.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getGender() != null) profile.setGender(dto.getGender());
        if (dto.getBloodGroup() != null) profile.setBloodGroup(dto.getBloodGroup());

        User user = profile.getUser();
        boolean userUpdated = false;
        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
            userUpdated = true;
        }
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            user.setPhone(dto.getPhone().trim());
            userUpdated = true;
        }
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword().trim()));
            userUpdated = true;
        }
        if (userUpdated) {
            userRepository.save(user);
        }

        return mapToDto(patientProfileRepository.save(profile));
    }

    @Transactional
    public void deletePatientAccount(Long userId) {
        log.info("Deleting patient account and profile for userId: {}", userId);
        PatientProfile profile = patientProfileRepository.findByUserId(userId).orElse(null);
        if (profile != null) {
            List<TriageSession> sessions = triageSessionRepository.findByPatientProfileIdOrderByCreatedAtDesc(profile.getId());
            for (TriageSession session : sessions) {
                // Delete associated emergency incidents (cascades notifications)
                emergencyIncidentRepository.findByTriageSessionId(session.getId())
                        .ifPresent(emergencyIncidentRepository::delete);

                // Delete associated clinician reviews
                List<ClinicianReview> reviews = clinicianReviewRepository.findByTriageSessionIdOrderByReviewTimestampDesc(session.getId());
                if (!reviews.isEmpty()) {
                    clinicianReviewRepository.deleteAll(reviews);
                }

                // Delete session (cascades vitals, symptoms, decision trace)
                triageSessionRepository.delete(session);
            }

            // Delete consent records
            List<ConsentRecord> consentRecords = consentRecordRepository.findByPatientProfileId(profile.getId());
            if (!consentRecords.isEmpty()) {
                consentRecordRepository.deleteAll(consentRecords);
            }

            // Delete patient profile (cascades conditions, allergies, medications, contacts)
            patientProfileRepository.delete(profile);
            patientProfileRepository.flush();
        }

        // Unassign any triage sessions where this user was the assigned clinician
        List<TriageSession> clinicianSessions = triageSessionRepository.findByAssignedClinicianId(userId);
        for (TriageSession cs : clinicianSessions) {
            cs.setAssignedClinician(null);
            triageSessionRepository.save(cs);
        }

        // Delete any clinician reviews authored by this user
        List<ClinicianReview> authoredReviews = clinicianReviewRepository.findByClinicianIdOrderByReviewTimestampDesc(userId);
        if (!authoredReviews.isEmpty()) {
            clinicianReviewRepository.deleteAll(authoredReviews);
        }

        userRepository.deleteById(userId);
        userRepository.flush();
        log.info("Successfully deleted patient account for userId: {}", userId);
    }

    @Transactional
    public PatientProfileDto.ConditionDto addCondition(Long userId, PatientProfileDto.ConditionDto dto) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        PatientCondition condition = PatientCondition.builder()
                .patientProfile(profile)
                .conditionName(dto.getConditionName())
                .category(dto.getCategory())
                .diagnosedYear(dto.getDiagnosedYear())
                .notes(dto.getNotes())
                .build();
        PatientCondition saved = conditionRepository.save(condition);
        return mapConditionToDto(saved);
    }

    @Transactional
    public PatientProfileDto.AllergyDto addAllergy(Long userId, PatientProfileDto.AllergyDto dto) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        PatientAllergy allergy = PatientAllergy.builder()
                .patientProfile(profile)
                .allergen(dto.getAllergen())
                .reactionType(dto.getReactionType())
                .severityLevel(dto.getSeverityLevel())
                .notes(dto.getNotes())
                .build();
        PatientAllergy saved = allergyRepository.save(allergy);
        return mapAllergyToDto(saved);
    }

    @Transactional
    public PatientProfileDto.MedicationDto addMedication(Long userId, PatientProfileDto.MedicationDto dto) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        PatientMedication medication = PatientMedication.builder()
                .patientProfile(profile)
                .medicationName(dto.getMedicationName())
                .dosage(dto.getDosage())
                .frequency(dto.getFrequency())
                .notes(dto.getNotes())
                .build();
        PatientMedication saved = medicationRepository.save(medication);
        return mapMedicationToDto(saved);
    }

    @Transactional
    public PatientProfileDto.EmergencyContactDto addEmergencyContact(Long userId, PatientProfileDto.EmergencyContactDto dto) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        PatientEmergencyContact contact = PatientEmergencyContact.builder()
                .patientProfile(profile)
                .contactName(dto.getContactName())
                .relationship(dto.getRelationship())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .primaryContact(dto.isPrimaryContact())
                .build();
        PatientEmergencyContact saved = emergencyContactRepository.save(contact);
        return mapEmergencyContactToDto(saved);
    }

    @Transactional
    public void recordConsent(Long userId, String consentType, String version, boolean granted, String ipAddress) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        ConsentRecord record = ConsentRecord.builder()
                .patientProfile(profile)
                .consentType(consentType)
                .version(version)
                .granted(granted)
                .ipAddress(ipAddress)
                .build();
        consentRecordRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<ConsentRecord> getConsentRecords(Long userId) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        return consentRecordRepository.findByPatientProfileId(profile.getId());
    }

    public PatientProfileDto mapToDto(PatientProfile profile) {
        User user = profile.getUser();
        return PatientProfileDto.builder()
                .id(profile.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .bloodGroup(profile.getBloodGroup())
                .conditions(profile.getConditions().stream().map(this::mapConditionToDto).collect(Collectors.toList()))
                .allergies(profile.getAllergies().stream().map(this::mapAllergyToDto).collect(Collectors.toList()))
                .medications(profile.getMedications().stream().map(this::mapMedicationToDto).collect(Collectors.toList()))
                .emergencyContacts(profile.getEmergencyContacts().stream().map(this::mapEmergencyContactToDto).collect(Collectors.toList()))
                .build();
    }

    private PatientProfileDto.ConditionDto mapConditionToDto(PatientCondition c) {
        return PatientProfileDto.ConditionDto.builder()
                .id(c.getId())
                .conditionName(c.getConditionName())
                .category(c.getCategory())
                .diagnosedYear(c.getDiagnosedYear())
                .notes(c.getNotes())
                .build();
    }

    private PatientProfileDto.AllergyDto mapAllergyToDto(PatientAllergy a) {
        return PatientProfileDto.AllergyDto.builder()
                .id(a.getId())
                .allergen(a.getAllergen())
                .reactionType(a.getReactionType())
                .severityLevel(a.getSeverityLevel())
                .notes(a.getNotes())
                .build();
    }

    private PatientProfileDto.MedicationDto mapMedicationToDto(PatientMedication m) {
        return PatientProfileDto.MedicationDto.builder()
                .id(m.getId())
                .medicationName(m.getMedicationName())
                .dosage(m.getDosage())
                .frequency(m.getFrequency())
                .notes(m.getNotes())
                .build();
    }

    private PatientProfileDto.EmergencyContactDto mapEmergencyContactToDto(PatientEmergencyContact e) {
        return PatientEmergencyContactDto(e);
    }

    private PatientProfileDto.EmergencyContactDto PatientEmergencyContactDto(PatientEmergencyContact e) {
        return PatientProfileDto.EmergencyContactDto.builder()
                .id(e.getId())
                .contactName(e.getContactName())
                .relationship(e.getRelationship())
                .phone(e.getPhone())
                .email(e.getEmail())
                .primaryContact(e.isPrimaryContact())
                .build();
    }
}
