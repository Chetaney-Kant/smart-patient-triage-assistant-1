package com.healthcare.triage.ai;

import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.ai.guardrail.AiGuardrail;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class AiServiceFactory {

    private final Map<String, AiProvider> providers;
    private final AiGuardrail aiGuardrail;

    @Getter
    @Setter
    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    @Getter
    @Setter
    @Value("${app.ai.provider:fallback}")
    private String activeProviderKey;

    public AiServiceFactory(
            Map<String, AiProvider> providers,
            AiGuardrail aiGuardrail) {
        this.providers = providers;
        this.aiGuardrail = aiGuardrail;
    }

    public AiTriageResponse processTriage(AiTriageRequest request) {
        // 1. Check AI Kill Switch
        if (!aiEnabled) {
            log.warn("AI Kill Switch is ACTIVE (AI Disabled by administrator). Operating in Safe Degraded Mode.");
            return aiGuardrail.buildDegradedResponse("AI Disabled by Administrator");
        }

        // 2. Select Provider
        AiProvider provider = getActiveProvider();
        log.info("Processing AI Triage with provider: {}", provider.getProviderName());

        try {
            AiTriageResponse rawResponse = provider.generateAssessment(request);
            // 3. Pass through Strict Clinical Guardrails & Schema Validator
            return aiGuardrail.validateAndSanitize(rawResponse);
        } catch (Exception ex) {
            log.error("AI Provider error: {}. Degrading gracefully.", ex.getMessage(), ex);
            return aiGuardrail.buildDegradedResponse("Provider Exception: " + ex.getMessage());
        }
    }

    public AiProvider getActiveProvider() {
        String key = activeProviderKey.toLowerCase() + "AiProvider";
        if (providers.containsKey(key)) {
            return providers.get(key);
        }
        return providers.getOrDefault("fallbackAiProvider", providers.values().iterator().next());
    }
}
