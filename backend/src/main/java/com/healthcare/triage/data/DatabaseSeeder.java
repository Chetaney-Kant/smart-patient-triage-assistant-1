package com.healthcare.triage.data;

import com.healthcare.triage.auth.User;
import com.healthcare.triage.auth.UserRepository;
import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.common.UserRole;
import com.healthcare.triage.intake.TriageDecisionTrace;
import com.healthcare.triage.intake.TriageDecisionTraceRepository;
import com.healthcare.triage.intake.TriageSession;
import com.healthcare.triage.intake.TriageSessionRepository;
import com.healthcare.triage.intake.TriageVitals;
import com.healthcare.triage.intake.TriageVitalsRepository;
import com.healthcare.triage.patient.*;
import com.healthcare.triage.safety.SafetyRule;
import com.healthcare.triage.safety.SafetyRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientProfileRepository profileRepository;
    private final PatientConditionRepository conditionRepository;
    private final PatientAllergyRepository allergyRepository;
    private final PatientMedicationRepository medicationRepository;
    private final PatientEmergencyContactRepository contactRepository;
    private final SafetyRuleRepository safetyRuleRepository;
    private final TriageSessionRepository sessionRepository;
    private final TriageVitalsRepository vitalsRepository;
    private final TriageDecisionTraceRepository traceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (safetyRuleRepository.count() == 0) {
            seedSafetyRules();
        }

        if (userRepository.count() == 0) {
            seedUsersAndPatients();
        }
    }

    private void seedSafetyRules() {
        log.info("Seeding standard governed clinical safety rules...");
        List<SafetyRule> rules = List.of(
                SafetyRule.builder()
                        .ruleCode("RULE-CARDIO-001")
                        .category("CARDIOVASCULAR")
                        .description("Acute severe retrosternal chest pain with radiation or diaphoresis")
                        .priority(TriagePriority.EMERGENCY)
                        .sourceGuideline("AHA/ACC Emergency Cardiovascular Care Guidelines (2024)")
                        .evidenceReference("Acute Coronary Syndrome Triaging Protocol: Immediate 12-lead ECG and physician assessment within 10 minutes.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 1, 15))
                        .build(),

                SafetyRule.builder()
                        .ruleCode("RULE-RESP-001")
                        .category("RESPIRATORY")
                        .description("Severe hypoxemia (SpO2 < 90%) or acute respiratory distress with gasping")
                        .priority(TriagePriority.EMERGENCY)
                        .sourceGuideline("WHO Standard Triage Protocol & British Thoracic Society Oxygen Guidelines")
                        .evidenceReference("Severe Hypoxemia Protocol: Immediate oxygen therapy and emergency airway assessment.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 2, 1))
                        .build(),

                SafetyRule.builder()
                        .ruleCode("RULE-NEURO-001")
                        .category("NEUROLOGICAL")
                        .description("Sudden focal neurological deficit (FAST criteria) or thunderclap headache")
                        .priority(TriagePriority.EMERGENCY)
                        .sourceGuideline("AHA/ASA Acute Ischemic Stroke Management Guidelines")
                        .evidenceReference("Time-Critical Stroke Window: Emergency CT and neurological evaluation.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 1, 20))
                        .build(),

                SafetyRule.builder()
                        .ruleCode("RULE-ALLERGY-001")
                        .category("ALLERGY")
                        .description("Systemic anaphylaxis with stridor, bronchospasm, or hypotension")
                        .priority(TriagePriority.EMERGENCY)
                        .sourceGuideline("World Allergy Organization (WAO) Anaphylaxis Guidelines")
                        .evidenceReference("Immediate intramuscular epinephrine administration protocol.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 2, 10))
                        .build(),

                SafetyRule.builder()
                        .ruleCode("RULE-TRAUMA-001")
                        .category("TRAUMA")
                        .description("Severe active hemorrhage or hemodynamic shock pattern (SBP < 80 with HR > 120)")
                        .priority(TriagePriority.EMERGENCY)
                        .sourceGuideline("ATLS (Advanced Trauma Life Support) Hemorrhage Protocol")
                        .evidenceReference("Resuscitative trauma protocol and surgical hemoperitoneum exclusion.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 1, 10))
                        .build(),

                SafetyRule.builder()
                        .ruleCode("RULE-URGENT-001")
                        .category("GASTROINTESTINAL")
                        .description("Acute moderate-to-severe abdominal pain with localized tenderness or fever")
                        .priority(TriagePriority.URGENT)
                        .sourceGuideline("Emergency Medicine Abdominal Pain Clinical Practice Guidelines")
                        .evidenceReference("Evaluation for acute surgical abdomen (appendicitis, cholecystitis, diverticulitis) within 2-4 hours.")
                        .ruleVersion("v1.0.0-clinical-core")
                        .isActive(true)
                        .lastReviewedDate(LocalDate.of(2025, 2, 15))
                        .build()
        );

        safetyRuleRepository.saveAll(rules);
    }

    private void seedUsersAndPatients() {
        log.info("Seeding demo users, clinicians, and synthetic triage cases...");

        // 1. Clinician Fleet
        User doctor1 = User.builder()
                .email("doctor@hospital.com")
                .passwordHash(passwordEncoder.encode("Doctor@123"))
                .fullName("Dr. Rajesh Kumar, MD")
                .role(UserRole.ROLE_CLINICIAN)
                .department("Cardiology")
                .specialization("Interventional Cardiologist")
                .availabilityStatus("AVAILABLE")
                .phone("+91-9876543210")
                .active(true)
                .build();
        userRepository.save(doctor1);

        User doctor2 = User.builder()
                .email("ananya.gastro@hospital.com")
                .passwordHash(passwordEncoder.encode("Doctor@123"))
                .fullName("Dr. Ananya Sharma, MD")
                .role(UserRole.ROLE_CLINICIAN)
                .department("Gastroenterology")
                .specialization("Gastroenterologist & Hepatologist")
                .availabilityStatus("AVAILABLE")
                .phone("+91-9876543211")
                .active(true)
                .build();
        userRepository.save(doctor2);

        User doctor3 = User.builder()
                .email("vikram.pulmo@hospital.com")
                .passwordHash(passwordEncoder.encode("Doctor@123"))
                .fullName("Dr. Vikram Mehta, MD")
                .role(UserRole.ROLE_CLINICIAN)
                .department("Pulmonology")
                .specialization("Pulmonologist & Critical Care")
                .availabilityStatus("AVAILABLE")
                .phone("+91-9876543212")
                .active(true)
                .build();
        userRepository.save(doctor3);

        User doctor4 = User.builder()
                .email("priya.neuro@hospital.com")
                .passwordHash(passwordEncoder.encode("Doctor@123"))
                .fullName("Dr. Priya Nair, MD")
                .role(UserRole.ROLE_CLINICIAN)
                .department("Neurology")
                .specialization("Neurologist & Stroke Specialist")
                .availabilityStatus("AVAILABLE")
                .phone("+91-9876543213")
                .active(true)
                .build();
        userRepository.save(doctor4);

        User doctor5 = User.builder()
                .email("arun.er@hospital.com")
                .passwordHash(passwordEncoder.encode("Doctor@123"))
                .fullName("Dr. Arun Patel, MD")
                .role(UserRole.ROLE_CLINICIAN)
                .department("General Medicine / Emergency")
                .specialization("Emergency Medicine Specialist")
                .availabilityStatus("AVAILABLE")
                .phone("+91-9876543214")
                .active(true)
                .build();
        userRepository.save(doctor5);

        // 2. Admin User
        User admin = User.builder()
                .email("admin@hospital.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .fullName("System Administrator")
                .role(UserRole.ROLE_ADMIN)
                .phone("+91-9876500000")
                .active(true)
                .build();
        userRepository.save(admin);

        // 3. Emergency Operator User
        User operator = User.builder()
                .email("operator@hospital.com")
                .passwordHash(passwordEncoder.encode("Operator@123"))
                .fullName("Emergency Dispatcher Priya")
                .role(UserRole.ROLE_EMERGENCY_OPERATOR)
                .phone("+91-9876511111")
                .active(true)
                .build();
        userRepository.save(operator);

        // 4. Patient User: Sarah Connor
        User patientUser = User.builder()
                .email("patient@hospital.com")
                .passwordHash(passwordEncoder.encode("Patient@123"))
                .fullName("Sarah Connor")
                .role(UserRole.ROLE_PATIENT)
                .phone("+91-9876522222")
                .active(true)
                .build();
        User savedPatientUser = userRepository.save(patientUser);

        PatientProfile profile = PatientProfile.builder()
                .user(savedPatientUser)
                .dateOfBirth(LocalDate.of(1988, 5, 14))
                .gender("Female")
                .bloodGroup("O+")
                .build();
        PatientProfile savedProfile = profileRepository.save(profile);

        // Conditions & Allergies & Medications
        conditionRepository.save(PatientCondition.builder()
                .patientProfile(savedProfile)
                .conditionName("Mild Asthma")
                .category("RESPIRATORY")
                .diagnosedYear(2018)
                .notes("Well managed with inhaler as needed")
                .build());

        allergyRepository.save(PatientAllergy.builder()
                .patientProfile(savedProfile)
                .allergen("Penicillin")
                .reactionType("Cutaneous Rash")
                .severityLevel("MODERATE")
                .notes("Discovered during childhood")
                .build());

        medicationRepository.save(PatientMedication.builder()
                .patientProfile(savedProfile)
                .medicationName("Salbutamol Inhaler")
                .dosage("100 mcg")
                .frequency("As needed for wheezing")
                .notes("PRN")
                .build());

        contactRepository.save(PatientEmergencyContact.builder()
                .patientProfile(savedProfile)
                .contactName("John Connor")
                .relationship("Son")
                .phone("+91-9876533333")
                .email("john.connor@example.com")
                .primaryContact(true)
                .build());

        // Seed 1: Seeded Historical Emergency Triage Case
        TriageSession emergencySession = TriageSession.builder()
                .sessionCode("TRG-2026-EMG01")
                .patientProfile(savedProfile)
                .assignedClinician(doctor1)
                .status(TriageState.EMERGENCY_DECLARED)
                .primarySymptom("Severe crushing chest pain")
                .durationHours(2)
                .severity1To10(9)
                .bodyLocation("Chest / Sternum")
                .rawSymptomsText("Crushing heavy pressure on chest radiating to left arm with cold diaphoresis.")
                .deterministicLevel(TriagePriority.EMERGENCY)
                .aiLevel(TriagePriority.EMERGENCY)
                .finalPriority(TriagePriority.EMERGENCY)
                .assessmentConfidenceIndicator(0.95)
                .safetyRuleVersion("v1.0.0-clinical-core")
                .aiModelVersion("gemini-1.5-flash")
                .completedAt(Instant.now().minusSeconds(3600))
                .build();
        TriageSession savedEmg = sessionRepository.save(emergencySession);

        TriageVitals emgVitals = TriageVitals.builder()
                .triageSession(savedEmg)
                .heartRate(112)
                .systolicBp(145)
                .diastolicBp(95)
                .spo2(94.0)
                .respiratoryRate(24)
                .temperatureC(37.1)
                .sourceType("SIMULATED_DEVICE")
                .plausible(true)
                .build();
        vitalsRepository.save(emgVitals);

        TriageDecisionTrace emgTrace = TriageDecisionTrace.builder()
                .triageSession(savedEmg)
                .whyText("Priority 'EMERGENCY' designated: Deterministic safety criteria triggered [RULE-CARDIO-001: Acute severe retrosternal chest pain with radiation]. Contributing factors: high severity (9/10), left arm radiation, diaphoresis.")
                .whyNotText("Lower priorities excluded due to acute ACS warning indicators requiring emergency stabilization.")
                .triggeredRuleCode("RULE-CARDIO-001")
                .triggeringInputs("Severe chest pain (9/10); Left arm radiation; Diaphoresis")
                .aiRawOutput("Clinical presentation strongly aligns with Acute Coronary Syndrome protocol.")
                .precedenceResolution("Deterministic Safety Rule [RULE-CARDIO-001] triggered EMERGENCY priority.")
                .clinicalExplanation("Reported symptoms present acute cardiovascular warning signs. Immediate 12-lead ECG and emergency department triage protocol activated.")
                .recommendedNextAction("Seek immediate emergency medical evaluation. Dispatching emergency hospital alert.")
                .suggestedDepartment("Emergency / Cardiology")
                .riskFactorsJson("[\"High severity 9/10\",\"Retrosternal pressure with radiation\",\"Diaphoresis\"]")
                .missingInformationJson("[]")
                .evidenceSourcesJson("[\"AHA/ACC Emergency Cardiovascular Care Guidelines (2024)\"]")
                .requiresHumanReview(true)
                .build();
        traceRepository.save(emgTrace);

        // Seed 2: Seeded Urgent Case
        TriageSession urgentSession = TriageSession.builder()
                .sessionCode("TRG-2026-URG02")
                .patientProfile(savedProfile)
                .assignedClinician(doctor2)
                .status(TriageState.URGENT_TRIAGED)
                .primarySymptom("Severe lower right abdominal pain")
                .durationHours(14)
                .severity1To10(7)
                .bodyLocation("Lower Right Abdomen")
                .rawSymptomsText("Started around belly button, migrated to lower right side, nausea present.")
                .deterministicLevel(TriagePriority.URGENT)
                .aiLevel(TriagePriority.URGENT)
                .finalPriority(TriagePriority.URGENT)
                .assessmentConfidenceIndicator(0.88)
                .safetyRuleVersion("v1.0.0-clinical-core")
                .aiModelVersion("gemini-1.5-flash")
                .completedAt(Instant.now().minusSeconds(1800))
                .build();
        TriageSession savedUrg = sessionRepository.save(urgentSession);

        TriageVitals urgVitals = TriageVitals.builder()
                .triageSession(savedUrg)
                .heartRate(88)
                .systolicBp(120)
                .diastolicBp(80)
                .spo2(98.0)
                .respiratoryRate(18)
                .temperatureC(38.2)
                .sourceType("PATIENT")
                .plausible(true)
                .build();
        vitalsRepository.save(urgVitals);

        TriageDecisionTrace urgTrace = TriageDecisionTrace.builder()
                .triageSession(savedUrg)
                .whyText("Priority 'URGENT' designated: Migratory lower right abdominal pain with low-grade fever indicates potential acute appendicitis.")
                .whyNotText("Emergency priority deferred as hemodynamics are stable. Routine priority excluded due to localized surgical abdomen risk.")
                .triggeredRuleCode("RULE-URGENT-001")
                .triggeringInputs("RLQ abdominal pain; Duration 14h; Temp 38.2°C")
                .aiRawOutput("Clinical picture warrants urgent surgical abdomen evaluation.")
                .precedenceResolution("Clinical consensus: URGENT priority designated for urgent in-person physical assessment.")
                .clinicalExplanation("Migratory abdominal discomfort and fever require prompt clinical evaluation to exclude acute appendicitis.")
                .recommendedNextAction("Report to urgent care center or clinic within 2-4 hours. Refrain from eating solid food.")
                .suggestedDepartment("General Surgery / Urgent Care")
                .riskFactorsJson("[\"RLQ localized tenderness\",\"Fever 38.2°C\",\"Duration 14h\"]")
                .missingInformationJson("[]")
                .evidenceSourcesJson("[\"Emergency Medicine Abdominal Pain Clinical Practice Guidelines\"]")
                .requiresHumanReview(true)
                .build();
        traceRepository.save(urgTrace);

        log.info("Demo data seeding completed successfully.");
    }
}
