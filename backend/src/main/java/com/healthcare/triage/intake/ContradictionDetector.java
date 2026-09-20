package com.healthcare.triage.intake;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
public class ContradictionDetector {

    public static class ContradictionResult {
        public boolean hasContradiction = false;
        public List<String> contradictionItems = new ArrayList<>();
        public String clinicalGuidance;
    }

    /**
     * Enforces clinical safety invariant:
     * A normal vital sign (e.g. SpO2 99%, HR 75 bpm) must NEVER silently suppress or override
     * severe reported symptoms (e.g. severe gasping dyspnea, crushing chest pain).
     */
    public ContradictionResult detectContradictions(
            String primarySymptom,
            String rawSymptomsText,
            int severity1To10,
            TriageVitals vitals) {

        ContradictionResult result = new ContradictionResult();
        if (vitals == null) return result;

        String combinedText = ((primarySymptom != null ? primarySymptom : "") + " " +
                (rawSymptomsText != null ? rawSymptomsText : "")).toLowerCase(Locale.ROOT);

        // 1. Severe Breathing Distress vs Normal / High SpO2
        boolean reportsSevereDyspnea = (combinedText.contains("shortness of breath") || combinedText.contains("gasping") ||
                combinedText.contains("cannot breathe") || combinedText.contains("suffocating")) && severity1To10 >= 8;

        if (reportsSevereDyspnea && vitals.getSpo2() != null && vitals.getSpo2() >= 98.0) {
            result.hasContradiction = true;
            result.contradictionItems.add(String.format(
                    "Patient reported severe dyspnea (Severity %d/10) alongside normal resting SpO2 (%.1f%%).",
                    severity1To10, vitals.getSpo2()
            ));
            result.clinicalGuidance = "Severe respiratory distress symptoms must not be dismissed despite normal pulse oximetry. Recommend clinician review for hyperventilation, pulmonary embolism, or carbon monoxide exposure.";
        }

        // 2. Severe Crushing Chest Pain vs Normal Heart Rate
        boolean reportsCrushingChestPain = (combinedText.contains("crushing chest") || combinedText.contains("heart attack")) &&
                severity1To10 >= 8;

        if (reportsCrushingChestPain && vitals.getHeartRate() != null && vitals.getHeartRate() >= 60 && vitals.getHeartRate() <= 80) {
            result.hasContradiction = true;
            result.contradictionItems.add(String.format(
                    "Patient reported high-severity chest pain (%d/10) alongside normal resting heart rate (%d bpm).",
                    severity1To10, vitals.getHeartRate()
            ));
            result.clinicalGuidance = "Normal heart rate does not rule out acute coronary syndrome or myocardial ischemia. Retaining high priority.";
        }

        // 3. High Fever reported vs Normal/Low Body Temperature
        boolean reportsHighFever = combinedText.contains("high fever") || combinedText.contains("burning up");
        if (reportsHighFever && vitals.getTemperatureC() != null && vitals.getTemperatureC() < 37.0) {
            result.hasContradiction = true;
            result.contradictionItems.add(String.format(
                    "Reported high fever sensation, but recorded temperature is %.1f°C (Apyrexial).",
                    vitals.getTemperatureC()
            ));
            result.clinicalGuidance = "Self-reported fever sensation without thermometric elevation may indicate subjective chills or recent antipyretic medication use.";
        }

        return result;
    }
}
