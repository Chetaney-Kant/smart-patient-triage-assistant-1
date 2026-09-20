package com.healthcare.triage.ai.guardrail;

import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.common.TriagePriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiGuardrail {

    private final PromptInjectionDetector injectionDetector;

    private static final Pattern DIAGNOSIS_CLAIM_PATTERN = Pattern.compile(
            "(you\\s+have|i\\s+diagnose\\s+you\\s+with|confirmed\\s+case\\s+of|you\\s+are\\s+suffering\\s+from)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PRESCRIPTION_PATTERN = Pattern.compile(
            "(take|prescribe|administer|inject)\\s+\\d+\\s*(mg|ml|tablets|pills)",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Validates AI response against strict clinical guardrails.
     * Ensures zero unsupported diagnosis claims and zero medication prescriptions.
     */
    public AiTriageResponse validateAndSanitize(AiTriageResponse response) {
        if (response == null) {
            return buildDegradedResponse("Null response from AI provider");
        }

        if (response.getTriageLevel() == null) {
            response.setTriageLevel(TriagePriority.INSUFFICIENT_INFO);
            response.setRequiresHumanReview(true);
        }

        // 1. Sanitize Explanation for Diagnostic Overreach
        String explanation = response.getClinicalExplanation();
        if (explanation != null) {
            if (DIAGNOSIS_CLAIM_PATTERN.matcher(explanation).find()) {
                log.warn("AI generated definitive diagnosis statement. Sanitizing explanation.");
                explanation = DIAGNOSIS_CLAIM_PATTERN.matcher(explanation)
                        .replaceAll("your reported clinical pattern may warrant assessment for");
                response.setClinicalExplanation(explanation);
                response.setRequiresHumanReview(true);
            }

            if (PRESCRIPTION_PATTERN.matcher(explanation).find()) {
                log.warn("AI generated medication prescription dosage. Sanitizing explanation.");
                explanation = PRESCRIPTION_PATTERN.matcher(explanation)
                        .replaceAll("[Medication recommendation omitted: Prescriptions require physician consultation]");
                response.setClinicalExplanation(explanation);
                response.setRequiresHumanReview(true);
            }
        }

        // 2. Sanitize Next Steps
        String nextAction = response.getRecommendedNextAction();
        if (nextAction != null && PRESCRIPTION_PATTERN.matcher(nextAction).find()) {
            response.setRecommendedNextAction("Consult with a qualified physician for individualized medical advice.");
        }

        // 3. Ensure Confidence Indicator Is Bounded (0.0 to 1.0)
        if (response.getAssessmentConfidenceIndicator() == null) {
            response.setAssessmentConfidenceIndicator(0.70);
        } else {
            double bounded = Math.max(0.10, Math.min(1.0, response.getAssessmentConfidenceIndicator()));
            response.setAssessmentConfidenceIndicator(Math.round(bounded * 100.0) / 100.0);
        }

        return response;
    }

    public AiTriageResponse buildDegradedResponse(String reason) {
        return AiTriageResponse.builder()
                .triageLevel(TriagePriority.INSUFFICIENT_INFO)
                .assessmentConfidenceIndicator(0.50)
                .clinicalExplanation("AI assessment service is operating in Safe Degraded Mode (" + reason + "). Deterministic safety checks remain active.")
                .recommendedNextAction("Proceed with human clinician review or seek emergency services if experiencing severe warning signs.")
                .suggestedDepartment("General Triage")
                .requiresHumanReview(true)
                .degradedMode(true)
                .degradationReason(reason)
                .build();
    }
}
