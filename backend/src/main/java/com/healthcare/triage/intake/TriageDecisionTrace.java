package com.healthcare.triage.intake;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "triage_decision_traces", indexes = {
        @Index(name = "idx_decision_trace_session", columnList = "triage_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageDecisionTrace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_session_id", nullable = false)
    @JsonIgnore
    private TriageSession triageSession;

    @Column(columnDefinition = "TEXT")
    private String whyText;

    @Column(columnDefinition = "TEXT")
    private String whyNotText;

    @Column(length = 50)
    private String triggeredRuleCode;

    @Column(columnDefinition = "TEXT")
    private String triggeringInputs;

    @Column(columnDefinition = "TEXT")
    private String aiRawOutput;

    @Column(columnDefinition = "TEXT")
    private String precedenceResolution;

    @Column(columnDefinition = "TEXT")
    private String clinicalExplanation;

    @Column(columnDefinition = "TEXT")
    private String recommendedNextAction;

    @Column(length = 100)
    private String suggestedDepartment;

    @Column(columnDefinition = "TEXT")
    private String riskFactorsJson;

    @Column(columnDefinition = "TEXT")
    private String missingInformationJson;

    @Column(columnDefinition = "TEXT")
    private String evidenceSourcesJson;

    @Builder.Default
    @Column(nullable = false)
    private boolean requiresHumanReview = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
