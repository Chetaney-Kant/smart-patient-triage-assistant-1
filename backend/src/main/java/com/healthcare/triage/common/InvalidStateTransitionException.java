package com.healthcare.triage.common;

public class InvalidStateTransitionException extends AppException {
    public InvalidStateTransitionException(TriageState current, TriageState target) {
        super(String.format("Invalid triage state transition from '%s' to '%s'", current, target));
    }
}
