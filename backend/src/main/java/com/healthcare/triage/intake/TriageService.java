package com.healthcare.triage.intake;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.triage.ai.AiServiceFactory;
import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.clinician.ClinicianAllotmentService;
import com.healthcare.triage.common.InvalidStateTransitionException;
import com.healthcare.triage.common.ResourceNotFoundException;
import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.intake.dto.TriageIntakeRequest;
import com.healthcare.triage.intake.dto.TriageSessionResponseDto;
import com.healthcare.triage.patient.*;
import com.healthcare.triage.audit.AuditLogService;
import com.healthcare.triage.safety.DeterministicSafetyEngine;
import com.healthcare.triage.safety.SafetyEvaluationResult;
import com.healthcare.triage.websocket.TriageEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriageService {

    private final TriageSessionRepository sessionRepository;
    private final TriageVitalsRepository vitalsRepository;
    private final TriageSymptomResponseRepository responseRepository;
    private final TriageDecisionTraceRepository decisionTraceRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DeterministicSafetyEngine safetyEngine;
    private final AiServiceFactory aiServiceFactory;
    private final VitalsValidator vitalsValidator;
    private final ContradictionDetector contradictionDetector;
    private final AuditLogService auditLogService;
    private final TriageEventPublisher eventPublisher;
    private final ClinicianAllotmentService clinicianAllotmentService;
    private final ObjectMapper objectMapper;

    @Transactional
    public TriageSessionResponseDto processIntake(Long userId, TriageIntakeRequest request, String ipAddress, String correlationId) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));

        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<TriageSession> existing = sessionRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent request received for key: {}. Returning existing session {}",
                        request.getIdempotencyKey(), existing.get().getSessionCode());
                return mapToResponseDto(existing.get());
            }
        }

        // 1. Build & Validate Vitals
        TriageVitals vitals = null;
        if (request.getVitals() != null) {
            vitals = TriageVitals.builder()
                    .heartRate(request.getVitals().getHeartRate())
                    .systolicBp(request.getVitals().getSystolicBp())
                    .diastolicBp(request.getVitals().getDiastolicBp())
                    .spo2(request.getVitals().getSpo2())
                    .respiratoryRate(request.getVitals().getRespiratoryRate())
                    .temperatureC(request.getVitals().getTemperatureC())
                    .bloodGlucose(request.getVitals().getBloodGlucose())
                    .sourceType(request.getVitals().getSourceType() != null ? request.getVitals().getSourceType() : "PATIENT")
                    .build();

            var validation = vitalsValidator.validate(vitals);
            vitals.setPlausible(validation.isPlausible);
        }

        // 2. Detect Contradictions (Clinical Invariant: Normal vitals NEVER suppress severe reported symptoms)
        var contradictionResult = contradictionDetector.detectContradictions(
                request.getPrimarySymptom(),
                request.getRawSymptomsText(),
                request.getSeverity1To10(),
                vitals
        );

        if (vitals != null && contradictionResult.hasContradiction) {
            vitals.setContradictionDetected(true);
            vitals.setContradictionDetails(String.join("; ", contradictionResult.contradictionItems));
        }

        // Calculate patient age
        Integer patientAge = null;
        if (profile.getDateOfBirth() != null) {
            patientAge = Period.between(profile.getDateOfBirth(), LocalDate.now()).getYears();
        }

        List<String> conditions = profile.getConditions().stream()
                .map(PatientCondition::getConditionName)
                .collect(Collectors.toList());

        // 3. Run Deterministic Safety Engine (High Priority Invariant)
        SafetyEvaluationResult safetyResult = safetyEngine.evaluate(
                request.getPrimarySymptom(),
                request.getRawSymptomsText(),
                request.getSeverity1To10(),
                request.getDurationHours(),
                vitals,
                patientAge,
                conditions
        );

        // 4. Run AI Triage Engine via Active Provider & Guardrail
        List<AiTriageRequest.SymptomQnAResponse> qnaResponses = request.getSymptomResponses().stream()
                .map(r -> new AiTriageRequest.SymptomQnAResponse(r.getQuestionText(), r.getResponseText()))
                .collect(Collectors.toList());

        AiTriageRequest aiRequest = AiTriageRequest.builder()
                .primarySymptom(request.getPrimarySymptom())
                .rawSymptomsText(request.getRawSymptomsText())
                .severity1To10(request.getSeverity1To10())
                .durationHours(request.getDurationHours())
                .bodyLocation(request.getBodyLocation())
                .patientAge(patientAge)
                .gender(profile.getGender())
                .chronicConditions(conditions)
                .knownAllergies(profile.getAllergies().stream().map(PatientAllergy::getAllergen).toList())
                .currentMedications(profile.getMedications().stream().map(PatientMedication::getMedicationName).toList())
                .vitals(vitals)
                .adaptiveResponses(qnaResponses)
                .build();

        AiTriageResponse aiResponse = aiServiceFactory.processTriage(aiRequest);

        // 5. Precedence & Conflict Resolution
        TriagePriority deterministicPriority = safetyResult.getDeterministicPriority();
        TriagePriority aiPriority = aiResponse.getTriageLevel();
        TriagePriority finalPriority;
        TriageState sessionState;
        String precedenceNote;
        boolean conflictDetected = false;

        if (safetyResult.isRedFlagTriggered()) {
            finalPriority = deterministicPriority;
            if (aiPriority == TriagePriority.NORMAL) {
                conflictDetected = true;
                precedenceNote = String.format(
                        "CONFLICT RESOLUTION: Deterministic Safety Rule [%s] identified EMERGENCY red-flag. Overruled AI recommendation of NORMAL.",
                        safetyResult.getTriggeredRuleCode()
                );
                sessionState = TriageState.CONFLICT_DETECTED;
            } else {
                precedenceNote = String.format(
                        "Deterministic Safety Rule [%s] triggered %s priority.",
                        safetyResult.getTriggeredRuleCode(), deterministicPriority
                );
                sessionState = (deterministicPriority == TriagePriority.EMERGENCY) ?
                        TriageState.EMERGENCY_DECLARED : TriageState.URGENT_TRIAGED;
            }
        } else if (aiPriority == TriagePriority.EMERGENCY) {
            finalPriority = TriagePriority.EMERGENCY;
            precedenceNote = "AI Clinical Reasoning identified potential high-acuity indicators; escalated to EMERGENCY.";
            sessionState = TriageState.EMERGENCY_DECLARED;
        } else if (aiPriority == TriagePriority.URGENT) {
            finalPriority = TriagePriority.URGENT;
            precedenceNote = "Clinical presentation indicates urgent evaluation within 2-4 hours.";
            sessionState = TriageState.URGENT_TRIAGED;
        } else if (aiPriority == TriagePriority.INSUFFICIENT_INFO) {
            finalPriority = TriagePriority.INSUFFICIENT_INFO;
            precedenceNote = "Insufficient clinical information provided for definitive triage stratification.";
            sessionState = TriageState.INSUFFICIENT_INFO_FLAGGED;
        } else {
            finalPriority = TriagePriority.NORMAL;
            precedenceNote = "Symptoms consistent with routine non-emergency care.";
            sessionState = TriageState.ROUTINE_TRIAGED;
        }

        if (contradictionResult.hasContradiction) {
            precedenceNote += " [CONTRADICTION NOTE: " + String.join("; ", contradictionResult.contradictionItems) + "]";
            if (sessionState == TriageState.ROUTINE_TRIAGED) {
                sessionState = TriageState.CONFLICT_DETECTED;
            }
        }

        // 6. Persist Triage Session
        String sessionCode = "TRG-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        TriageSession session = TriageSession.builder()
                .sessionCode(sessionCode)
                .patientProfile(profile)
                .status(sessionState)
                .primarySymptom(request.getPrimarySymptom())
                .durationHours(request.getDurationHours())
                .severity1To10(request.getSeverity1To10())
                .bodyLocation(request.getBodyLocation())
                .rawSymptomsText(request.getRawSymptomsText())
                .deterministicLevel(deterministicPriority)
                .aiLevel(aiPriority)
                .finalPriority(finalPriority)
                .assessmentConfidenceIndicator(aiResponse.getAssessmentConfidenceIndicator())
                .safetyRuleVersion(safetyResult.getRuleVersion())
                .aiModelVersion(aiResponse.getModelVersion())
                .idempotencyKey(request.getIdempotencyKey())
                .completedAt(Instant.now())
                .build();

        TriageSession savedSession = sessionRepository.save(session);

        // Attach Vitals
        if (vitals != null) {
            vitals.setTriageSession(savedSession);
            vitalsRepository.save(vitals);
            savedSession.setVitals(vitals);
        }

        // Attach Symptom QnA Responses
        if (request.getSymptomResponses() != null) {
            for (var respDto : request.getSymptomResponses()) {
                TriageSymptomResponse symptomResp = TriageSymptomResponse.builder()
                        .triageSession(savedSession)
                        .questionId(respDto.getQuestionId())
                        .questionText(respDto.getQuestionText())
                        .responseText(respDto.getResponseText())
                        .build();
                responseRepository.save(symptomResp);
                savedSession.getSymptomResponses().add(symptomResp);
            }
        }

        // Build Decision Trace
        String whyText = buildWhyText(finalPriority, safetyResult, aiResponse, contradictionResult);
        String whyNotText = buildWhyNotText(finalPriority, safetyResult);

        TriageDecisionTrace decisionTrace = TriageDecisionTrace.builder()
                .triageSession(savedSession)
                .whyText(whyText)
                .whyNotText(whyNotText)
                .triggeredRuleCode(safetyResult.getTriggeredRuleCode())
                .triggeringInputs(String.join("; ", safetyResult.getTriggeringInputs()))
                .aiRawOutput(aiResponse.getClinicalExplanation())
                .precedenceResolution(precedenceNote)
                .clinicalExplanation(aiResponse.getClinicalExplanation())
                .recommendedNextAction(aiResponse.getRecommendedNextAction())
                .suggestedDepartment(aiResponse.getSuggestedDepartment())
                .riskFactorsJson(writeJson(aiResponse.getRiskFactors()))
                .missingInformationJson(writeJson(aiResponse.getMissingInformation()))
                .evidenceSourcesJson(writeJson(aiResponse.getEvidenceSources()))
                .requiresHumanReview(aiResponse.isRequiresHumanReview() || finalPriority != TriagePriority.NORMAL || conflictDetected)
                .build();

        decisionTraceRepository.save(decisionTrace);
        savedSession.setDecisionTrace(decisionTrace);

        // 6.5 Intelligent Doctor Auto-Allotment
        clinicianAllotmentService.allotClinician(savedSession, aiResponse.getSuggestedDepartment());
        sessionRepository.save(savedSession);

        // 7. Audit Log Entry
        auditLogService.logEvent(
                correlationId,
                userId,
                profile.getUser().getRole().name(),
                conflictDetected ? "AI_CONFLICT_DETECTED" : "TRIAGE_SESSION_CREATED",
                "TriageSession",
                savedSession.getId().toString(),
                String.format("{\"priority\":\"%s\",\"status\":\"%s\",\"rule\":\"%s\",\"allottedDoctor\":\"%s\"}",
                        finalPriority, sessionState, safetyResult.getTriggeredRuleCode(),
                        savedSession.getAssignedClinician() != null ? savedSession.getAssignedClinician().getFullName() : "UNASSIGNED"),
                ipAddress
        );

        // 8. WebSocket Broadcast
        eventPublisher.broadcastTriageUpdate(TriageEventPublisher.LiveTriageEvent.builder()
                .eventType(sessionState.name())
                .sessionId(savedSession.getId())
                .sessionCode(savedSession.getSessionCode())
                .patientName(profile.getUser().getFullName())
                .priority(finalPriority.name())
                .status(sessionState.name())
                .primarySymptom(savedSession.getPrimarySymptom())
                .triggeredRule(safetyResult.getTriggeredRuleCode())
                .requiresAttention(finalPriority != TriagePriority.NORMAL)
                .build());

        return mapToResponseDto(savedSession);
    }

    @Transactional(readOnly = true)
    public List<TriageSessionResponseDto> getPatientTriageHistory(Long userId) {
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientProfile", "userId", userId));
        return sessionRepository.findByPatientProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TriageSessionResponseDto getSessionByCode(String sessionCode) {
        TriageSession session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("TriageSession", "sessionCode", sessionCode));
        return mapToResponseDto(session);
    }

    @Transactional(readOnly = true)
    public TriageSessionResponseDto getSessionById(Long sessionId) {
        TriageSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TriageSession", "id", sessionId));
        return mapToResponseDto(session);
    }

    public TriageSessionResponseDto mapToResponseDto(TriageSession s) {
        PatientProfile profile = s.getPatientProfile();
        Integer age = profile.getDateOfBirth() != null ? Period.between(profile.getDateOfBirth(), LocalDate.now()).getYears() : null;

        TriageIntakeRequest.TriageVitalsDto vitalsDto = null;
        if (s.getVitals() != null) {
            vitalsDto = TriageIntakeRequest.TriageVitalsDto.builder()
                    .heartRate(s.getVitals().getHeartRate())
                    .systolicBp(s.getVitals().getSystolicBp())
                    .diastolicBp(s.getVitals().getDiastolicBp())
                    .spo2(s.getVitals().getSpo2())
                    .respiratoryRate(s.getVitals().getRespiratoryRate())
                    .temperatureC(s.getVitals().getTemperatureC())
                    .bloodGlucose(s.getVitals().getBloodGlucose())
                    .sourceType(s.getVitals().getSourceType())
                    .build();
        }

        List<TriageIntakeRequest.SymptomAnswerDto> responses = s.getSymptomResponses().stream()
                .map(r -> new TriageIntakeRequest.SymptomAnswerDto(r.getQuestionId(), r.getQuestionText(), r.getResponseText()))
                .collect(Collectors.toList());

        TriageSessionResponseDto.DecisionTraceDto traceDto = null;
        if (s.getDecisionTrace() != null) {
            TriageDecisionTrace trace = s.getDecisionTrace();
            traceDto = TriageSessionResponseDto.DecisionTraceDto.builder()
                    .whyText(trace.getWhyText())
                    .whyNotText(trace.getWhyNotText())
                    .triggeredRuleCode(trace.getTriggeredRuleCode())
                    .triggeringInputs(trace.getTriggeringInputs())
                    .precedenceResolution(trace.getPrecedenceResolution())
                    .clinicalExplanation(trace.getClinicalExplanation())
                    .recommendedNextAction(trace.getRecommendedNextAction())
                    .suggestedDepartment(trace.getSuggestedDepartment())
                    .riskFactors(readJsonList(trace.getRiskFactorsJson()))
                    .missingInformation(readJsonList(trace.getMissingInformationJson()))
                    .evidenceSources(readJsonList(trace.getEvidenceSourcesJson()))
                    .requiresHumanReview(trace.isRequiresHumanReview())
                    .build();
        }

        return TriageSessionResponseDto.builder()
                .id(s.getId())
                .sessionCode(s.getSessionCode())
                .patientId(profile.getId())
                .patientName(profile.getUser().getFullName())
                .patientAge(age)
                .patientGender(profile.getGender())
                .status(s.getStatus())
                .primarySymptom(s.getPrimarySymptom())
                .durationHours(s.getDurationHours())
                .severity1To10(s.getSeverity1To10())
                .bodyLocation(s.getBodyLocation())
                .rawSymptomsText(s.getRawSymptomsText())
                .deterministicLevel(s.getDeterministicLevel())
                .aiLevel(s.getAiLevel())
                .finalPriority(s.getFinalPriority())
                .assessmentConfidenceIndicator(s.getAssessmentConfidenceIndicator())
                .safetyRuleVersion(s.getSafetyRuleVersion())
                .aiModelVersion(s.getAiModelVersion())
                .assignedClinicianId(s.getAssignedClinician() != null ? s.getAssignedClinician().getId() : null)
                .assignedClinicianName(s.getAssignedClinician() != null ? s.getAssignedClinician().getFullName() : null)
                .assignedClinicianDepartment(s.getAssignedClinician() != null ? s.getAssignedClinician().getDepartment() : null)
                .assignedClinicianSpecialization(s.getAssignedClinician() != null ? s.getAssignedClinician().getSpecialization() : null)
                .vitals(vitalsDto)
                .symptomResponses(responses)
                .decisionTrace(traceDto)
                .createdAt(s.getCreatedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    private String buildWhyText(TriagePriority priority, SafetyEvaluationResult safety, AiTriageResponse ai, ContradictionDetector.ContradictionResult contradiction) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Priority '%s' was designated because: ", priority));
        if (safety.isRedFlagTriggered()) {
            sb.append(String.format("Deterministic safety criteria triggered [%s: %s]. ", safety.getTriggeredRuleCode(), safety.getRuleDescription()));
        } else {
            sb.append("No immediate deterministic red flags were triggered. ");
        }
        if (ai.getRiskFactors() != null && !ai.getRiskFactors().isEmpty()) {
            sb.append("Contributing risk factors: ").append(String.join(", ", ai.getRiskFactors())).append(". ");
        }
        if (contradiction.hasContradiction) {
            sb.append("A data contradiction was noted: ").append(contradiction.clinicalGuidance);
        }
        return sb.toString().trim();
    }

    private String buildWhyNotText(TriagePriority priority, SafetyEvaluationResult safety) {
        if (priority == TriagePriority.EMERGENCY) {
            return "Lower priorities (Urgent/Normal) were excluded due to immediate acute life-threat warning signs requiring emergency medical assessment.";
        } else if (priority == TriagePriority.URGENT) {
            return "Normal priority was excluded due to moderate-high symptom severity or duration requiring timely physician review. Emergency priority was not triggered as critical hemodynamic or airway red flags were absent.";
        } else if (priority == TriagePriority.NORMAL) {
            return "Emergency and Urgent priorities were excluded because no vital sign instability, red-flag symptoms, or acute severe physiological distress markers were present.";
        } else {
            return "Definitive triage prioritization was deferred due to insufficient symptom characterization.";
        }
    }

    private String writeJson(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> readJsonList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
