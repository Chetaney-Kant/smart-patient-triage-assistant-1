package com.healthcare.triage.emergency;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "emergency_notifications", indexes = {
        @Index(name = "idx_notifications_incident", columnList = "emergency_incident_id"),
        @Index(name = "idx_notifications_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_incident_id", nullable = false)
    @JsonIgnore
    private EmergencyIncident incident;

    @Column(nullable = false, length = 50)
    private String recipientType; // EMERGENCY_CONTACT, HOSPITAL_ER, AMBULANCE_DISPATCH

    @Column(nullable = false, length = 120)
    private String destination; // phone number, email, or dept channel

    @Column(nullable = false, length = 30)
    private String channel; // SMS, EMAIL, WEBHOOK, DASHBOARD

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "SENT"; // CREATED, SENT, DELIVERED, ACKNOWLEDGED, FAILED

    @Builder.Default
    @Column(nullable = false)
    private boolean simulatedFlag = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant sentAt;

    private Instant acknowledgedAt;
}
