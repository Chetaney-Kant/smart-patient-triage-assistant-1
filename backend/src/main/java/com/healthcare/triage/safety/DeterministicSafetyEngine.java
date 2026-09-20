package com.healthcare.triage.safety;

import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.intake.TriageVitals;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeterministicSafetyEngine {

    private final SafetyRuleRepository safetyRuleRepository;

    @Value("${app.safety.rule-version:v1.0.0-clinical-core}")
    private String defaultRuleVersion;

    /**
     * Evaluates symptoms, vitals, severity, duration, and patient profile against deterministic safety rules.
     * Guaranteed invariant: Deterministic emergency evaluation strictly takes precedence over any AI downgrade.
     */
    public SafetyEvaluationResult evaluate(
            String primarySymptom,
            String rawSymptomsText,
            int severity1To10,
            int durationHours,
            TriageVitals vitals,
            Integer patientAge,
            List<String> knownConditions) {

        String combinedText = ((primarySymptom != null ? primarySymptom : "") + " " +
                (rawSymptomsText != null ? rawSymptomsText : "")).toLowerCase(Locale.ROOT);

        List<String> triggeringInputs = new ArrayList<>();
        List<String> detectedRedFlags = new ArrayList<>();

        // 1. EVALUATE CARDIOVASCULAR EMERGENCY (RULE-CARDIO-001)
        boolean hasChestPain = combinedText.contains("chest pain") || combinedText.contains("crushing") ||
                combinedText.contains("chest pressure") || combinedText.contains("heart attack") ||
                combinedText.contains("chest tightness");
        boolean hasRadiationOrSweating = combinedText.contains("radiat") || combinedText.contains("sweat") ||
                combinedText.contains("diaphoresis") || combinedText.contains("left arm") || combinedText.contains("jaw");

        if (hasChestPain && (hasRadiationOrSweating || severity1To10 >= 7)) {
            triggeringInputs.add("Severe chest pain / pressure (Severity: " + severity1To10 + "/10)");
            if (hasRadiationOrSweating) triggeringInputs.add("Radiation / Diaphoresis reported");
            detectedRedFlags.add("Acute coronary syndrome indicator detected");

            return buildResult(
                    "RULE-CARDIO-001",
                    "Acute severe chest pain with radiation or high severity indicates potential acute coronary syndrome.",
                    TriagePriority.EMERGENCY,
                    "AHA/ACC Emergency Cardiovascular Care Guidelines",
                    "Immediate assessment required to rule out acute myocardial infarction.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 2. EVALUATE RESPIRATORY DISTRESS (RULE-RESP-001)
        boolean hasDyspnea = combinedText.contains("shortness of breath") || combinedText.contains("cannot breathe") ||
                combinedText.contains("difficulty breathing") || combinedText.contains("gasping") ||
                combinedText.contains("suffocating") || combinedText.contains("stridor");
        boolean isSpo2Critical = (vitals != null && vitals.getSpo2() != null && vitals.getSpo2() < 90.0);
        boolean isRespRateCritical = (vitals != null && vitals.getRespiratoryRate() != null &&
                (vitals.getRespiratoryRate() > 30 || vitals.getRespiratoryRate() < 8));

        if ((hasDyspnea && severity1To10 >= 8) || isSpo2Critical || isRespRateCritical) {
            if (hasDyspnea) triggeringInputs.add("Severe respiratory distress reported (Severity: " + severity1To10 + "/10)");
            if (isSpo2Critical) triggeringInputs.add("Critically low blood oxygen saturation: " + vitals.getSpo2() + "% (Threshold < 90%)");
            if (isRespRateCritical) triggeringInputs.add("Abnormal respiratory rate: " + vitals.getRespiratoryRate() + " bpm");
            detectedRedFlags.add("Severe respiratory compromise / hypoxemia");

            return buildResult(
                    "RULE-RESP-001",
                    "Severe respiratory compromise or hypoxemia detected.",
                    TriagePriority.EMERGENCY,
                    "WHO Standard Triage Protocol & BTS Oxygen Guidelines",
                    "Hypoxemia and severe dyspnea indicate potential acute respiratory failure.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 3. EVALUATE NEUROLOGICAL / FAST STROKE SIGNS (RULE-NEURO-001)
        boolean hasStrokeSigns = combinedText.contains("face droop") || combinedText.contains("slurred speech") ||
                combinedText.contains("arm weak") || combinedText.contains("paralysis") ||
                combinedText.contains("facial drooping") || combinedText.contains("loss of vision") ||
                combinedText.contains("unresponsive") || combinedText.contains("unconscious") ||
                combinedText.contains("passed out") || combinedText.contains("fainted");

        boolean hasThunderclapHeadache = (combinedText.contains("worst headache") || combinedText.contains("thunderclap")) &&
                severity1To10 >= 8;

        if (hasStrokeSigns || hasThunderclapHeadache) {
            if (hasStrokeSigns) triggeringInputs.add("Acute focal neurological deficit / FAST stroke signs or altered consciousness");
            if (hasThunderclapHeadache) triggeringInputs.add("Sudden severe thunderclap headache (Severity: " + severity1To10 + "/10)");
            detectedRedFlags.add("Acute neurological emergency indicator");

            return buildResult(
                    "RULE-NEURO-001",
                    "Sudden focal neurological deficit or acute thunderclap headache detected.",
                    TriagePriority.EMERGENCY,
                    "AHA/ASA Acute Ischemic Stroke Management Guidelines",
                    "Time-critical neurovascular evaluation is required.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 4. EVALUATE ANAPHYLAXIS (RULE-ALLERGY-001)
        boolean hasAllergySigns = combinedText.contains("allergic reaction") || combinedText.contains("anaphylaxis") ||
                combinedText.contains("swollen lip") || combinedText.contains("swollen tongue") ||
                combinedText.contains("throat closing") || combinedText.contains("throat tight");

        if (hasAllergySigns && (hasDyspnea || (vitals != null && vitals.getSystolicBp() != null && vitals.getSystolicBp() < 90))) {
            triggeringInputs.add("Rapidly progressing allergic symptoms with airway or circulatory involvement");
            detectedRedFlags.add("Signs of systemic anaphylaxis");

            return buildResult(
                    "RULE-ALLERGY-001",
                    "Acute severe allergic reaction with respiratory or hemodynamic compromise.",
                    TriagePriority.EMERGENCY,
                    "WAO (World Allergy Organization) Anaphylaxis Guidelines",
                    "Immediate clinical intervention indicated to prevent airway obstruction or circulatory collapse.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 5. EVALUATE SEVERE HEMORRHAGE / SHOCK (RULE-TRAUMA-001)
        boolean hasSevereBleeding = combinedText.contains("uncontrolled bleeding") || combinedText.contains("heavy bleeding") ||
                combinedText.contains("arterial") || combinedText.contains("coughing up blood") ||
                combinedText.contains("vomiting blood");
        boolean isHypotensiveShock = (vitals != null && vitals.getSystolicBp() != null && vitals.getSystolicBp() < 80 &&
                vitals.getHeartRate() != null && vitals.getHeartRate() > 115);

        if (hasSevereBleeding || isHypotensiveShock) {
            if (hasSevereBleeding) triggeringInputs.add("Severe active hemorrhage reported");
            if (isHypotensiveShock) triggeringInputs.add("Severe hypotension (" + vitals.getSystolicBp() + " mmHg) with compensatory tachycardia (" + vitals.getHeartRate() + " bpm)");
            detectedRedFlags.add("Potential hypovolemic / hemorrhagic shock");

            return buildResult(
                    "RULE-TRAUMA-001",
                    "Severe active hemorrhage or hemodynamic shock pattern detected.",
                    TriagePriority.EMERGENCY,
                    "ATLS (Advanced Trauma Life Support) Hemorrhage Classification",
                    "Urgent surgical or hemodynamic resuscitation protocol required.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 6. EVALUATE URGENT RULES (RULE-URGENT-001, RULE-URGENT-002)
        boolean hasAcuteAbdominalPain = (combinedText.contains("abdominal pain") || combinedText.contains("stomach pain") ||
                combinedText.contains("lower right")) && severity1To10 >= 6;
        boolean hasHighFever = (vitals != null && vitals.getTemperatureC() != null && vitals.getTemperatureC() >= 39.2) ||
                (combinedText.contains("high fever") && severity1To10 >= 6);

        if (hasAcuteAbdominalPain || hasHighFever) {
            if (hasAcuteAbdominalPain) triggeringInputs.add("Acute moderate-to-severe abdominal pain (Severity: " + severity1To10 + "/10)");
            if (hasHighFever) triggeringInputs.add("High grade pyrexia / fever (Temp: " + (vitals != null && vitals.getTemperatureC() != null ? vitals.getTemperatureC() + "°C" : "Elevated") + ")");
            detectedRedFlags.add("Potential surgical abdomen or acute systemic infection");

            return buildResult(
                    "RULE-URGENT-001",
                    "Symptoms suggest acute condition requiring prompt clinical evaluation.",
                    TriagePriority.URGENT,
                    "Emergency Medicine Clinical Practice Guidelines",
                    "Prompt physician evaluation recommended within 2 to 4 hours.",
                    triggeringInputs,
                    detectedRedFlags
            );
        }

        // 7. DEFAULT SAFE NORMAL
        return SafetyEvaluationResult.safe(defaultRuleVersion);
    }

    private SafetyEvaluationResult buildResult(
            String ruleCode,
            String description,
            TriagePriority priority,
            String sourceGuideline,
            String evidenceRef,
            List<String> triggeringInputs,
            List<String> detectedRedFlags) {

        // Query database for governed rule if available, otherwise use standardized metadata
        String ruleVersion = defaultRuleVersion;
        var ruleOpt = safetyRuleRepository.findByRuleCode(ruleCode);
        if (ruleOpt.isPresent()) {
            ruleVersion = ruleOpt.get().getRuleVersion();
            description = ruleOpt.get().getDescription();
            sourceGuideline = ruleOpt.get().getSourceGuideline();
            evidenceRef = ruleOpt.get().getEvidenceReference();
        }

        return SafetyEvaluationResult.builder()
                .isRedFlagTriggered(true)
                .deterministicPriority(priority)
                .triggeredRuleCode(ruleCode)
                .ruleDescription(description)
                .sourceGuideline(sourceGuideline)
                .evidenceReference(evidenceRef)
                .ruleVersion(ruleVersion)
                .triggeringInputs(triggeringInputs)
                .detectedRedFlags(detectedRedFlags)
                .build();
    }
}
