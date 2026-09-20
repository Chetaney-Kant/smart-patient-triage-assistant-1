package com.healthcare.triage.safety;

import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.intake.TriageVitals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeterministicSafetyEngineTest {

    @Mock
    private SafetyRuleRepository safetyRuleRepository;

    @InjectMocks
    private DeterministicSafetyEngine safetyEngine;

    @BeforeEach
    void setUp() {
        lenient().when(safetyRuleRepository.findByRuleCode(anyString())).thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("RULE-CARDIO-001: Severe chest pain with left arm radiation triggers EMERGENCY")
    void testCardioEmergencyTriggered() {
        SafetyEvaluationResult result = safetyEngine.evaluate(
                "Chest pain",
                "Crushing pressure radiating to my left arm with heavy sweating",
                9,
                2,
                null,
                58,
                List.of("Hypertension")
        );

        assertTrue(result.isRedFlagTriggered());
        assertEquals(TriagePriority.EMERGENCY, result.getDeterministicPriority());
        assertEquals("RULE-CARDIO-001", result.getTriggeredRuleCode());
        assertFalse(result.getTriggeringInputs().isEmpty());
    }

    @Test
    @DisplayName("RULE-RESP-001: SpO2 < 90% triggers EMERGENCY regardless of patient age")
    void testRespiratoryCriticalHypoxemia() {
        TriageVitals vitals = TriageVitals.builder()
                .spo2(86.0)
                .respiratoryRate(32)
                .build();

        SafetyEvaluationResult result = safetyEngine.evaluate(
                "Shortness of breath",
                "Difficulty catching breath",
                8,
                1,
                vitals,
                35,
                List.of()
        );

        assertTrue(result.isRedFlagTriggered());
        assertEquals(TriagePriority.EMERGENCY, result.getDeterministicPriority());
        assertEquals("RULE-RESP-001", result.getTriggeredRuleCode());
    }

    @Test
    @DisplayName("RULE-NEURO-001: Sudden facial drooping and slurred speech triggers EMERGENCY")
    void testNeurologicalStrokeSigns() {
        SafetyEvaluationResult result = safetyEngine.evaluate(
                "Facial drooping",
                "Sudden weakness in right arm and slurred speech",
                8,
                1,
                null,
                70,
                List.of()
        );

        assertTrue(result.isRedFlagTriggered());
        assertEquals(TriagePriority.EMERGENCY, result.getDeterministicPriority());
        assertEquals("RULE-NEURO-001", result.getTriggeredRuleCode());
    }

    @Test
    @DisplayName("RULE-URGENT-001: Lower right abdominal pain with severity >= 6 triggers URGENT")
    void testAbdominalUrgentTriggered() {
        SafetyEvaluationResult result = safetyEngine.evaluate(
                "Severe abdominal pain",
                "Lower right side sharp pain with nausea",
                7,
                12,
                null,
                22,
                List.of()
        );

        assertTrue(result.isRedFlagTriggered());
        assertEquals(TriagePriority.URGENT, result.getDeterministicPriority());
        assertEquals("RULE-URGENT-001", result.getTriggeredRuleCode());
    }

    @Test
    @DisplayName("Non-red-flag benign symptoms evaluate to NORMAL without red flag")
    void testBenignSymptomsNormal() {
        SafetyEvaluationResult result = safetyEngine.evaluate(
                "Mild dry cough",
                "A little tickle in my throat for 2 days",
                2,
                48,
                null,
                28,
                List.of()
        );

        assertFalse(result.isRedFlagTriggered());
        assertEquals(TriagePriority.NORMAL, result.getDeterministicPriority());
    }
}
