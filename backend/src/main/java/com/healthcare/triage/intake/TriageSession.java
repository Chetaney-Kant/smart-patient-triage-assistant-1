package com.healthcare.triage.intake;

import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.patient.PatientProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "triage_sessions", indexes = {
        @Index(name = "idx_triage_patient", columnList = "patient_profile_id"),
        @Index(name = "idx_triage_code", columnList = "sessionCode", unique = true),
        @Index(name = "idx_triage_status", columnList = "status"),
        @Index(name = "idx_triage_priority", columnList = "finalPriority"),
        @Index(name = "idx_triage_idempotency", columnList = "idempotencyKey", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String sessionCode; // e.g. TRG-2026-9812

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_profile_id", nullable = false)
    private PatientProfile patientProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_clinician_id")
    private com.healthcare.triage.auth.User assignedClinician;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TriageState status;

    @Column(nullable = false, length = 150)
    private String primarySymptom;

    private Integer durationHours;

    private Integer severity1To10;

    @Column(length = 100)
    private String bodyLocation;

    @Column(columnDefinition = "TEXT")
    private String rawSymptomsText;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TriagePriority deterministicLevel;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TriagePriority aiLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TriagePriority finalPriority;

    private Double assessmentConfidenceIndicator;

    @Column(length = 50)
    private String safetyRuleVersion;

    @Column(length = 50)
    private String aiModelVersion;

    @Column(length = 64)
    private String idempotencyKey;

    @OneToOne(mappedBy = "triageSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private TriageVitals vitals;

    @OneToMany(mappedBy = "triageSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TriageSymptomResponse> symptomResponses = new ArrayList<>();

    @OneToOne(mappedBy = "triageSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private TriageDecisionTrace decisionTrace;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    private Instant completedAt;
}
