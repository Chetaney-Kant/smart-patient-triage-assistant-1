package com.healthcare.triage.patient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "consent_records", indexes = {
        @Index(name = "idx_consent_records_profile", columnList = "patient_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_profile_id", nullable = false)
    @JsonIgnore
    private PatientProfile patientProfile;

    @Column(nullable = false, length = 60)
    private String consentType; // e.g. TRIAGE_DATA_PROCESSING, EMERGENCY_CONTACT_ALERT, AUDIT_TRAIL_LOGGING

    @Column(nullable = false, length = 20)
    private String version; // e.g. v1.0

    @Column(nullable = false)
    private boolean granted;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    @Column(length = 60)
    private String ipAddress;
}
