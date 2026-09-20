package com.healthcare.triage.ai.dto;

import com.healthcare.triage.common.TriagePriority;
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
public class AiTriageResponse {
    private TriagePriority triageLevel;
    
    // Explicitly labeled as an assessment heuristic, NOT a validated statistical medical probability
    private Double assessmentConfidenceIndicator; // 0.0 to 1.0

    @Builder.Default
    private List<String> riskFactors = new ArrayList<>();

    @Builder.Default
    private List<String> missingInformation = new ArrayList<>();

    private String clinicalExplanation;
    private String recommendedNextAction;
    private String suggestedDepartment;
    private boolean requiresHumanReview;
    private String modelVersion;
    private String promptVersion;
    
    @Builder.Default
    private List<String> evidenceSources = new ArrayList<>();

    private boolean degradedMode;
    private String degradationReason;
}
