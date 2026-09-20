package com.healthcare.triage.intake;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "triage_vitals", indexes = {
        @Index(name = "idx_triage_vitals_session", columnList = "triage_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "triageSession")
public class TriageVitals {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_session_id", nullable = false)
    @JsonIgnore
    private TriageSession triageSession;

    private Integer heartRate; // bpm

    private Integer systolicBp; // mmHg

    private Integer diastolicBp; // mmHg

    private Double spo2; // %

    private Integer respiratoryRate; // breaths per min

    private Double temperatureC; // °Celsius

    private Double bloodGlucose; // mg/dL

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String sourceType = "PATIENT"; // PATIENT, CLINICIAN, SIMULATED_DEVICE

    @Builder.Default
    @Column(nullable = false)
    private boolean plausible = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean contradictionDetected = false;

    @Column(length = 255)
    private String contradictionDetails;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
