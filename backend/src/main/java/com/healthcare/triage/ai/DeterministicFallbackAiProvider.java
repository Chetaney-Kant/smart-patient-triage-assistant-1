package com.healthcare.triage.ai;

import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.common.TriagePriority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component("fallbackAiProvider")
public class DeterministicFallbackAiProvider implements AiProvider {

    @Override
    public String getProviderName() {
        return "Deterministic Clinical Heuristic Engine (Fallback)";
    }

    @Override
    public AiTriageResponse generateAssessment(AiTriageRequest request) {
        String symptom = (request.getPrimarySymptom() != null ? request.getPrimarySymptom() : "").toLowerCase(Locale.ROOT);
        String details = (request.getRawSymptomsText() != null ? request.getRawSymptomsText() : "").toLowerCase(Locale.ROOT);
        int severity = request.getSeverity1To10();
        int duration = request.getDurationHours();

        List<String> riskFactors = new ArrayList<>();
        List<String> missingInfo = new ArrayList<>();
        List<String> evidenceSources = List.of(
                "Emergency Medicine Clinical Decision Guidelines (2024 Revision)",
                "Standard Triage Category Classification Handbook"
        );

        if (severity == 0) missingInfo.add("Symptom severity not quantified");
        if (duration == 0) missingInfo.add("Exact symptom onset duration not specified");

        TriagePriority priority;
        String explanation;
        String nextAction;
        String dept;
        double confidence = 0.85;

        // Clinical heuristic evaluation
        if (symptom.contains("chest") || details.contains("chest") || severity >= 8) {
            priority = TriagePriority.EMERGENCY;
            riskFactors.add("High symptom severity score (" + severity + "/10)");
            riskFactors.add("Involvement of cardiopulmonary anatomical region");
            explanation = "Reported high-severity cardiopulmonary symptoms indicate potential immediate clinical risk requiring urgent stabilization.";
            nextAction = "Seek immediate emergency clinical evaluation.";
            dept = "Emergency / Cardiology";
        } else if (severity >= 5 || duration > 48 || symptom.contains("abdominal") || symptom.contains("fever") || symptom.contains("pain")) {
            priority = TriagePriority.URGENT;
            riskFactors.add("Moderate severity (" + severity + "/10) or prolonged duration (" + duration + " hours)");
            explanation = "Symptom constellation suggests acute condition that warrants timely in-person clinical assessment.";
            nextAction = "Schedule urgent outpatient evaluation or visit urgent care facility within 4-6 hours.";
            dept = "Internal Medicine / Urgent Care";
        } else if (symptom.isBlank() && details.isBlank()) {
            priority = TriagePriority.INSUFFICIENT_INFO;
            missingInfo.add("Chief complaint not articulated");
            explanation = "Insufficient clinical information provided to safely generate a triage recommendation.";
            nextAction = "Provide additional details regarding symptom onset, character, and location.";
            dept = "General Triage";
            confidence = 0.30;
        } else {
            priority = TriagePriority.NORMAL;
            explanation = "Reported symptoms are low-severity and short duration without acute red flags.";
            nextAction = "Follow up with primary care physician if symptoms persist or worsen. Seek routine medical evaluation.";
            dept = "General Practice / Outpatient";
        }

        return AiTriageResponse.builder()
                .triageLevel(priority)
                .assessmentConfidenceIndicator(confidence)
                .riskFactors(riskFactors)
                .missingInformation(missingInfo)
                .clinicalExplanation(explanation)
                .recommendedNextAction(nextAction)
                .suggestedDepartment(dept)
                .requiresHumanReview(priority != TriagePriority.NORMAL)
                .modelVersion("clinical-heuristic-v1")
                .promptVersion("v1.0.0-triage-safe")
                .evidenceSources(evidenceSources)
                .degradedMode(false)
                .build();
    }
}
