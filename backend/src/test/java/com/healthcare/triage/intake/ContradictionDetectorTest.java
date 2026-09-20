package com.healthcare.triage.intake;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ContradictionDetectorTest {

    private ContradictionDetector detector;

    @BeforeEach
    void setUp() {
        detector = new ContradictionDetector();
    }

    @Test
    @DisplayName("Invariant: Normal SpO2 of 99% does NOT suppress severe reported dyspnea")
    void testDyspneaVsNormalSpo2() {
        TriageVitals vitals = TriageVitals.builder()
                .spo2(99.0)
                .heartRate(75)
                .build();

        var result = detector.detectContradictions(
                "Shortness of breath",
                "I cannot breathe and I am gasping for air severely",
                9,
                vitals
        );

        assertTrue(result.hasContradiction);
        assertFalse(result.contradictionItems.isEmpty());
        assertTrue(result.clinicalGuidance.contains("Severe respiratory distress symptoms must not be dismissed"));
    }

    @Test
    @DisplayName("Normal cases without contradiction return clean result")
    void testConsistentVitalsNoContradiction() {
        TriageVitals vitals = TriageVitals.builder()
                .spo2(98.0)
                .heartRate(72)
                .temperatureC(36.8)
                .build();

        var result = detector.detectContradictions(
                "Mild headache",
                "Slight forehead ache after long screen time",
                3,
                vitals
        );

        assertFalse(result.hasContradiction);
        assertTrue(result.contradictionItems.isEmpty());
    }
}
