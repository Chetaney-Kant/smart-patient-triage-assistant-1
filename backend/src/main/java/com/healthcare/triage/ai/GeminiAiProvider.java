package com.healthcare.triage.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.triage.ai.dto.AiTriageRequest;
import com.healthcare.triage.ai.dto.AiTriageResponse;
import com.healthcare.triage.ai.guardrail.PromptInjectionDetector;
import com.healthcare.triage.common.TriagePriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component("geminiAiProvider")
@RequiredArgsConstructor
public class GeminiAiProvider implements AiProvider {

    private final DeterministicFallbackAiProvider fallbackProvider;
    private final PromptInjectionDetector injectionDetector;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model:gemini-1.5-flash}")
    private String model;

    @Value("${app.ai.prompt-version:v1.0.0-triage-safe}")
    private String promptVersion;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getProviderName() {
        return "Google Gemini AI (" + model + ")";
    }

    @Override
    public AiTriageResponse generateAssessment(AiTriageRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("Gemini API key is not configured. Automatically using Deterministic Clinical Fallback Provider.");
            return fallbackProvider.generateAssessment(request);
        }

        try {
            String sanitizedSymptom = injectionDetector.sanitizeInput(request.getPrimarySymptom());
            String sanitizedRaw = injectionDetector.sanitizeInput(request.getRawSymptomsText());

            String systemPrompt = """
                You are an AI Clinical Triage Decision-Support Assistant.
                CRITICAL MEDICAL SAFETY RULES:
                1. You are NOT a doctor. DO NOT provide definitive diagnoses (e.g. do not say "You have X").
                2. DO NOT prescribe medications or dosages.
                3. Classify priority into one of: EMERGENCY, URGENT, NORMAL, INSUFFICIENT_INFO.
                4. Always output strictly valid JSON matching the schema below.
                
                Required JSON Schema:
                {
                  "triageLevel": "EMERGENCY" | "URGENT" | "NORMAL" | "INSUFFICIENT_INFO",
                  "assessmentConfidenceIndicator": 0.85,
                  "riskFactors": ["factor 1", "factor 2"],
                  "missingInformation": ["missing 1"],
                  "clinicalExplanation": "Triage rationale in decision-support terms.",
                  "recommendedNextAction": "Next action instructions.",
                  "suggestedDepartment": "Emergency / Cardiology / Internal Medicine / General Practice",
                  "requiresHumanReview": true
                }
                """;

            String userPrompt = String.format(
                    "Patient Age: %s, Gender: %s\nPrimary Symptom: %s\nDetailed Description: %s\nSeverity (1-10): %d\nDuration (Hours): %d\nKnown Conditions: %s\nVitals: %s\nGenerate triage assessment JSON.",
                    request.getPatientAge() != null ? request.getPatientAge() : "Unknown",
                    request.getGender() != null ? request.getGender() : "Unknown",
                    sanitizedSymptom,
                    sanitizedRaw,
                    request.getSeverity1To10(),
                    request.getDurationHours(),
                    request.getChronicConditions() != null ? String.join(", ", request.getChronicConditions()) : "None",
                    request.getVitals() != null ? request.getVitals().toString() : "Not provided"
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(Map.of("text", systemPrompt + "\n\n" + userPrompt)))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "responseMimeType", "application/json"
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseGeminiJson(response.getBody());
            }

        } catch (Exception ex) {
            log.error("Gemini API call failed: {}. Safely degrading to Deterministic Fallback.", ex.getMessage());
        }

        return fallbackProvider.generateAssessment(request);
    }

    private AiTriageResponse parseGeminiJson(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            String rawJson = textNode.asText();

            // Parse inner JSON
            JsonNode data = objectMapper.readTree(rawJson);
            String levelStr = data.path("triageLevel").asText("INSUFFICIENT_INFO");
            TriagePriority priority = parsePriority(levelStr);
            double confidence = data.path("assessmentConfidenceIndicator").asDouble(0.75);

            List<String> riskFactors = new ArrayList<>();
            data.path("riskFactors").forEach(n -> riskFactors.add(n.asText()));

            List<String> missingInfo = new ArrayList<>();
            data.path("missingInformation").forEach(n -> missingInfo.add(n.asText()));

            String explanation = data.path("clinicalExplanation").asText("Clinical triage assessment completed.");
            String nextAction = data.path("recommendedNextAction").asText("Consult with a qualified healthcare professional.");
            String dept = data.path("suggestedDepartment").asText("General Medicine");
            boolean review = data.path("requiresHumanReview").asBoolean(true);

            return AiTriageResponse.builder()
                    .triageLevel(priority)
                    .assessmentConfidenceIndicator(confidence)
                    .riskFactors(riskFactors)
                    .missingInformation(missingInfo)
                    .clinicalExplanation(explanation)
                    .recommendedNextAction(nextAction)
                    .suggestedDepartment(dept)
                    .requiresHumanReview(review)
                    .modelVersion("gemini-1.5-flash")
                    .promptVersion(promptVersion)
                    .evidenceSources(List.of("Gemini Clinical Reasoning Engine", "AHA/WHO Standardized Triage Principles"))
                    .degradedMode(false)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse Gemini output JSON: {}", e.getMessage());
            return fallbackProvider.generateAssessment(null);
        }
    }

    private TriagePriority parsePriority(String levelStr) {
        try {
            return TriagePriority.valueOf(levelStr.toUpperCase());
        } catch (Exception e) {
            return TriagePriority.INSUFFICIENT_INFO;
        }
    }
}
