package com.healthcare.triage.intake;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "triage_symptom_responses", indexes = {
        @Index(name = "idx_triage_responses_session", columnList = "triage_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageSymptomResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_session_id", nullable = false)
    @JsonIgnore
    private TriageSession triageSession;

    @Column(nullable = false, length = 50)
    private String questionId;

    @Column(nullable = false, length = 255)
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String responseText;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
