package com.healthcare.triage.intake;

import com.healthcare.triage.common.TriageState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TriageServiceStateAndPrecedenceTest {

    @Test
    @DisplayName("State Machine: Validates permitted state transitions")
    void testStateTransitions() {
        assertTrue(TriageState.INTAKE_IN_PROGRESS.canTransitionTo(TriageState.INTAKE_COMPLETED));
        assertTrue(TriageState.SAFETY_EVALUATED.canTransitionTo(TriageState.EMERGENCY_DECLARED));
        assertTrue(TriageState.AWAITING_CLINICIAN_REVIEW.canTransitionTo(TriageState.CLINICIAN_ACCEPTED));
        assertTrue(TriageState.AWAITING_CLINICIAN_REVIEW.canTransitionTo(TriageState.CLINICIAN_OVERRIDDEN));
        assertTrue(TriageState.EMERGENCY_DISPATCHED.canTransitionTo(TriageState.RESOLVED));

        // Invalid transitions
        assertFalse(TriageState.INTAKE_IN_PROGRESS.canTransitionTo(TriageState.RESOLVED));
        assertFalse(TriageState.RESOLVED.canTransitionTo(TriageState.EMERGENCY_DECLARED));
    }
}
