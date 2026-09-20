package com.healthcare.triage.intake.dto;

import com.healthcare.triage.intake.TriageVitals;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageIntakeRequest {

    @NotBlank(message = "Primary symptom is required")
    private String primarySymptom;

    @Min(value = 0, message = "Duration must be positive")
    private int durationHours;

    @Min(value = 1, message = "Severity must be at least 1")
    @Max(value = 10, message = "Severity cannot exceed 10")
    private int severity1To10;

    private String bodyLocation;
    private String rawSymptomsText;

    private TriageVitalsDto vitals;

    @Builder.Default
    private List<SymptomAnswerDto> symptomResponses = new ArrayList<>();

    private String idempotencyKey;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriageVitalsDto {
        private Integer heartRate;
        private Integer systolicBp;
        private Integer diastolicBp;
        private Double spo2;
        private Integer respiratoryRate;
        private Double temperatureC;
        private Double bloodGlucose;
        private String sourceType; // PATIENT, CLINICIAN, SIMULATED_DEVICE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymptomAnswerDto {
        private String questionId;
        private String questionText;
        private String responseText;
    }
}
