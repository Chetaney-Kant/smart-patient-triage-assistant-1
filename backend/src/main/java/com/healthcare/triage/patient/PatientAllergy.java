package com.healthcare.triage.patient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "patient_allergies", indexes = {
        @Index(name = "idx_patient_allergies_profile", columnList = "patient_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAllergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_profile_id", nullable = false)
    @JsonIgnore
    private PatientProfile patientProfile;

    @Column(nullable = false, length = 150)
    private String allergen;

    @Column(length = 100)
    private String reactionType; // e.g. Anaphylaxis, Skin Rash, Swelling

    @Column(length = 30)
    private String severityLevel; // SEVERE, MODERATE, MILD

    @Column(length = 255)
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
