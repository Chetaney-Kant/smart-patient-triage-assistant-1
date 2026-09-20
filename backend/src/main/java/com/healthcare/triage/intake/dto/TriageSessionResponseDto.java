package com.healthcare.triage.intake.dto;

import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageSessionResponseDto {
    private Long id;
    private String sessionCode;
    private Long patientId;
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private TriageState status;
    private String primarySymptom;
    private Integer durationHours;
    private Integer severity1To10;
    private String bodyLocation;
    private String rawSymptomsText;
    
    private TriagePriority deterministicLevel;
    private TriagePriority aiLevel;
    private TriagePriority finalPriority;
    
    private Double assessmentConfidenceIndicator;
    private String safetyRuleVersion;
    private String aiModelVersion;

    private Long assignedClinicianId;
    private String assignedClinicianName;
    private String assignedClinicianDepartment;
    private String assignedClinicianSpecialization;

    private TriageIntakeRequest.TriageVitalsDto vitals;
    private List<TriageIntakeRequest.SymptomAnswerDto> symptomResponses;
    private DecisionTraceDto decisionTrace;
    
    private Instant createdAt;
    private Instant completedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionTraceDto {
        private String whyText;
        private String whyNotText;
        private String triggeredRuleCode;
        private String triggeringInputs;
        private String precedenceResolution;
        private String clinicalExplanation;
        private String recommendedNextAction;
        private String suggestedDepartment;
        private List<String> riskFactors;
        private List<String> missingInformation;
        private List<String> evidenceSources;
        private boolean requiresHumanReview;
    }
}
