package com.healthcare.triage.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_actor", columnList = "actorId"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_entity", columnList = "entityType,entityId"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sequenceNumber;

    @Column(nullable = false, length = 64)
    private String correlationId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    private Long actorId;

    @Column(length = 50)
    private String actorRole;

    @Column(nullable = false, length = 80)
    private String action; // e.g. TRIAGE_SUBMITTED, SAFETY_RULE_TRIGGERED, AI_CONFLICT_DETECTED, CLINICIAN_OVERRIDE

    @Column(nullable = false, length = 60)
    private String entityType; // e.g. TriageSession, PatientProfile, EmergencyIncident

    @Column(length = 60)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    @Column(length = 60)
    private String ipAddress;

    @Column(length = 64)
    private String previousRecordHash;

    @Column(nullable = false, length = 64)
    private String recordHash;
}
