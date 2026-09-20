package com.healthcare.triage.clinician;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.healthcare.triage.auth.User;
import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.intake.TriageSession;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "clinician_reviews", indexes = {
        @Index(name = "idx_clinician_reviews_session", columnList = "triage_session_id"),
        @Index(name = "idx_clinician_reviews_user", columnList = "clinician_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicianReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_session_id", nullable = false)
    @JsonIgnore
    private TriageSession triageSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinician_user_id", nullable = false)
    private User clinician;

    @Column(nullable = false, length = 30)
    private String actionType; // ACCEPT, OVERRIDE, ESCALATE, HANDOFF

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TriagePriority originalPriority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TriagePriority finalPriority;

    @Column(columnDefinition = "TEXT")
    private String overrideReason;

    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant reviewTimestamp;
}
