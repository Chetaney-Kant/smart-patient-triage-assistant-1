package com.healthcare.triage.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized AuditLog logEvent(
            String correlationId,
            Long actorId,
            String actorRole,
            String action,
            String entityType,
            String entityId,
            String metadataJson,
            String ipAddress) {

        String cid = (correlationId != null && !correlationId.isBlank()) ? correlationId : UUID.randomUUID().toString().substring(0, 8);
        var lastRecordOpt = auditLogRepository.findTopByOrderBySequenceNumberDesc();

        long nextSeq = lastRecordOpt.map(r -> r.getSequenceNumber() + 1).orElse(1L);
        String prevHash = lastRecordOpt.map(AuditLog::getRecordHash).orElse("GENESIS_BLOCK_HASH_HEALTHCARE_TRIAGE_2026");

        Instant now = Instant.now();
        String payload = String.format("%d|%s|%s|%s|%s|%s|%s|%s|%s",
                nextSeq, cid, now.toString(),
                actorId != null ? actorId : "ANON",
                actorRole != null ? actorRole : "UNKNOWN",
                action, entityType, entityId,
                prevHash);

        String currentHash = calculateSha256(payload);

        AuditLog entry = AuditLog.builder()
                .sequenceNumber(nextSeq)
                .correlationId(cid)
                .timestamp(now)
                .actorId(actorId)
                .actorRole(actorRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .metadataJson(metadataJson)
                .ipAddress(ipAddress)
                .previousRecordHash(prevHash)
                .recordHash(currentHash)
                .build();

        log.info("[AUDIT-{}] Action: {} | Actor: {} ({}) | Target: {} #{}",
                nextSeq, action, actorId, actorRole, entityType, entityId);

        return auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    private String calculateSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
