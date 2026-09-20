package com.healthcare.triage.intake;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class VitalsValidator {

    public static class VitalsValidationResult {
        public boolean isPlausible = true;
        public List<String> warnings = new ArrayList<>();
        public List<String> implausibleFields = new ArrayList<>();
    }

    public VitalsValidationResult validate(TriageVitals vitals) {
        VitalsValidationResult result = new VitalsValidationResult();
        if (vitals == null) return result;

        // Heart Rate check (Plausible physiological range: 30 to 250 bpm)
        if (vitals.getHeartRate() != null) {
            int hr = vitals.getHeartRate();
            if (hr < 30 || hr > 250) {
                result.isPlausible = false;
                result.implausibleFields.add("Heart Rate (" + hr + " bpm) is outside physiological limits (30-250 bpm)");
            } else if (hr < 50 || hr > 130) {
                result.warnings.add("Heart Rate (" + hr + " bpm) is outside standard resting parameters");
            }
        }

        // Blood Pressure check (Systolic: 50 to 280, Diastolic: 30 to 180, Systolic > Diastolic)
        if (vitals.getSystolicBp() != null && vitals.getDiastolicBp() != null) {
            int sys = vitals.getSystolicBp();
            int dia = vitals.getDiastolicBp();
            if (sys < 50 || sys > 280 || dia < 30 || dia > 180 || sys <= dia) {
                result.isPlausible = false;
                result.implausibleFields.add(String.format("Blood Pressure (%d/%d mmHg) is physiologically implausible", sys, dia));
            }
        }

        // SpO2 check (Plausible: 50% to 100%)
        if (vitals.getSpo2() != null) {
            double spo2 = vitals.getSpo2();
            if (spo2 < 50.0 || spo2 > 100.0) {
                result.isPlausible = false;
                result.implausibleFields.add("SpO2 (" + spo2 + "%) is invalid (must be between 50% and 100%)");
            }
        }

        // Respiratory Rate check (Plausible: 4 to 60 breaths/min)
        if (vitals.getRespiratoryRate() != null) {
            int rr = vitals.getRespiratoryRate();
            if (rr < 4 || rr > 60) {
                result.isPlausible = false;
                result.implausibleFields.add("Respiratory Rate (" + rr + " bpm) is outside physiological limits (4-60 bpm)");
            }
        }

        // Body Temperature check in Celsius (Plausible: 32.0°C to 44.0°C)
        if (vitals.getTemperatureC() != null) {
            double temp = vitals.getTemperatureC();
            if (temp < 32.0 || temp > 44.0) {
                result.isPlausible = false;
                result.implausibleFields.add("Temperature (" + temp + "°C) is outside living human parameters (32°C-44°C)");
            }
        }

        // Blood Glucose check (Plausible: 20 to 800 mg/dL)
        if (vitals.getBloodGlucose() != null) {
            double bg = vitals.getBloodGlucose();
            if (bg < 20.0 || bg > 800.0) {
                result.isPlausible = false;
                result.implausibleFields.add("Blood Glucose (" + bg + " mg/dL) is outside valid testing range (20-800 mg/dL)");
            }
        }

        return result;
    }
}
