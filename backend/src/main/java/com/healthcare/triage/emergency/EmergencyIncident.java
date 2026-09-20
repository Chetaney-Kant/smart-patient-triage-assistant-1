package com.healthcare.triage.emergency;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.healthcare.triage.intake.TriageSession;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "emergency_incidents", indexes = {
        @Index(name = "idx_emergency_code", columnList = "incidentCode", unique = true),
        @Index(name = "idx_emergency_status", columnList = "status"),
        @Index(name = "idx_emergency_session", columnList = "triage_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String incidentCode; // e.g. INC-2026-0042

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_session_id", nullable = false)
    @JsonIgnore
    private TriageSession triageSession;

    @Column(nullable = false, length = 30)
    private String severityLevel; // CRITICAL, HIGH

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "DISPATCHED"; // DISPATCHED, EN_ROUTE, HOSPITAL_ARRIVED, RESOLVED

    @Column(nullable = false, length = 60)
    private String departmentCode; // ER-TRAUMA, CARDIAC-ER, PULMONARY-ER, GENERAL-ER

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant dispatchTimestamp;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private Instant resolvedAt;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmergencyNotification> notifications = new ArrayList<>();
}
