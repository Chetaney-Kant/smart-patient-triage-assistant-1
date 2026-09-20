package com.healthcare.triage.patient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "patient_emergency_contacts", indexes = {
        @Index(name = "idx_patient_emergency_profile", columnList = "patient_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientEmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_profile_id", nullable = false)
    @JsonIgnore
    private PatientProfile patientProfile;

    @Column(nullable = false, length = 100)
    private String contactName;

    @Column(length = 60)
    private String relationship; // e.g. Spouse, Parent, Sibling, Guardian

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Builder.Default
    @Column(nullable = false)
    private boolean primaryContact = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
