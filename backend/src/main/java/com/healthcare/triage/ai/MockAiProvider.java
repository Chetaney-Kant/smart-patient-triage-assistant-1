package com.healthcare.triage.ai;

import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.common.TriagePriority;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("mockAiProvider")
@Getter
@Setter
public class MockAiProvider implements AiProvider {

    private TriagePriority presetPriority = null;
    private Double presetConfidence = 0.90;
    private boolean shouldThrowException = false;

    @Override
    public String getProviderName() {
        return "Mock Clinical AI Provider (Testing)";
    }

    @Override
    public AiTriageResponse generateAssessment(AiTriageRequest request) {
        if (shouldThrowException) {
            throw new RuntimeException("Simulated AI Provider Outage");
        }

        TriagePriority priority = presetPriority != null ? presetPriority :
                (request.getSeverity1To10() >= 7 ? TriagePriority.URGENT : TriagePriority.NORMAL);

        return AiTriageResponse.builder()
                .triageLevel(priority)
                .assessmentConfidenceIndicator(presetConfidence)
                .riskFactors(List.of("Mock evaluation parameter: Severity " + request.getSeverity1To10()))
                .missingInformation(List.of())
                .clinicalExplanation("Mock simulated clinical reasoning for testing and safety validation.")
                .recommendedNextAction("Standard clinical protocol according to priority level.")
                .suggestedDepartment("General Medicine")
                .requiresHumanReview(priority == TriagePriority.EMERGENCY || priority == TriagePriority.URGENT)
                .modelVersion("mock-v1")
                .promptVersion("v1.0.0-triage-safe")
                .evidenceSources(List.of("Mock Evidence Base v1"))
                .degradedMode(false)
                .build();
    }
}
