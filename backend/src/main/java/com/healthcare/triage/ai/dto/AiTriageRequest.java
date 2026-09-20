package com.healthcare.triage.ai.dto;

import com.healthcare.triage.intake.TriageVitals;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTriageRequest {
    private String primarySymptom;
    private String rawSymptomsText;
    private int severity1To10;
    private int durationHours;
    private String bodyLocation;
    private Integer patientAge;
    private String gender;
    private List<String> chronicConditions;
    private List<String> knownAllergies;
    private List<String> currentMedications;
    private TriageVitals vitals;
    private List<SymptomQnAResponse> adaptiveResponses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymptomQnAResponse {
        private String question;
        private String answer;
    }
}
