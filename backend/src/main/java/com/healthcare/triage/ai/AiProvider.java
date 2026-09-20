package com.healthcare.triage.ai;

import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;

public interface AiProvider {
    String getProviderName();
    AiTriageResponse generateAssessment(AiTriageRequest request);
}
