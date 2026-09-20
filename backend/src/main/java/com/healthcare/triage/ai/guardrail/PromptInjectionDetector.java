package com.healthcare.triage.ai.guardrail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Component
public class PromptInjectionDetector {

    private static final List<Pattern> INJECTION_PATTERNS = List.of(
            Pattern.compile("ignore\\s+(all\\s+)?(previous|prior|above)\\s+instructions?", Pattern.CASE_INSENSITIVE),
            Pattern.compile("override\\s+(the\\s+)?safety\\s*(rules|engine|checks)?", Pattern.CASE_INSENSITIVE),
            Pattern.compile("you\\s+are\\s+(now\\s+)?(a|an)\\s+(doctor|physician|prescriber)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("give\\s+me\\s+(a\\s+)?prescription\\s+for", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bypass\\s+(triage|security|guidelines)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("system\\s*prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("act\\s+as\\s+an\\s+unrestricted", Pattern.CASE_INSENSITIVE),
            Pattern.compile("say\\s+that\\s+everything\\s+is\\s+normal", Pattern.CASE_INSENSITIVE)
    );

    public boolean isInjectionAttempt(String text) {
        if (text == null || text.isBlank()) return false;
        String normalized = text.toLowerCase(Locale.ROOT);
        for (Pattern pattern : INJECTION_PATTERNS) {
            if (pattern.matcher(normalized).find()) {
                log.warn("Prompt injection pattern detected: '{}' in input: '{}'", pattern.pattern(), text);
                return true;
            }
        }
        return false;
    }

    public String sanitizeInput(String text) {
        if (text == null) return "";
        String sanitized = text;
        for (Pattern pattern : INJECTION_PATTERNS) {
            sanitized = pattern.matcher(sanitized).replaceAll("[UNTRUSTED_INSTRUCTION_REDACTED]");
        }
        return sanitized;
    }
}
