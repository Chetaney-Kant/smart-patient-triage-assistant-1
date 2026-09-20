package com.healthcare.triage.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriageEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiveTriageEvent {
        private String eventType; // TRIAGE_CREATED, PRIORITY_UPDATED, EMERGENCY_DECLARED, CLINICIAN_OVERRIDE
        private Long sessionId;
        private String sessionCode;
        private String patientName;
        private String priority;
        private String status;
        private String primarySymptom;
        private String triggeredRule;
        private boolean requiresAttention;
        @Builder.Default
        private Instant timestamp = Instant.now();
    }

    public void broadcastTriageUpdate(LiveTriageEvent event) {
        log.info("Broadcasting live triage event [{}] for session {}", event.getEventType(), event.getSessionCode());
        try {
            messagingTemplate.convertAndSend("/topic/triage-queue", event);
            if ("EMERGENCY_DECLARED".equals(event.getEventType()) || "EMERGENCY".equalsIgnoreCase(event.getPriority())) {
                messagingTemplate.convertAndSend("/topic/emergency-alerts", event);
            }
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed: {}", e.getMessage());
        }
    }
}
