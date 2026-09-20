package com.healthcare.triage.safety;

import com.healthcare.triage.common.TriagePriority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "safety_rules", indexes = {
        @Index(name = "idx_safety_rules_code", columnList = "ruleCode", unique = true),
        @Index(name = "idx_safety_rules_active", columnList = "isActive")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String ruleCode; // e.g. RULE-CARDIO-001, RULE-RESP-001, RULE-NEURO-001

    @Column(nullable = false, length = 60)
    private String category; // CARDIOVASCULAR, RESPIRATORY, NEUROLOGICAL, ANAPHYLAXIS, TRAUMA, SEPSIS

    @Column(nullable = false, length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TriagePriority priority; // EMERGENCY or URGENT

    @Column(nullable = false, length = 150)
    private String sourceGuideline; // e.g., "AHA/ACC Emergency Warning Guidelines", "WHO Standard Triage Protocol"

    @Column(columnDefinition = "TEXT")
    private String evidenceReference;

    @Column(nullable = false, length = 30)
    private String ruleVersion; // e.g. v1.0.0-clinical-core

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = true;

    private LocalDate lastReviewedDate;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
