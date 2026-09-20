package com.healthcare.triage.patient;

import com.healthcare.triage.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patient_profiles", indexes = {
        @Index(name = "idx_patient_profiles_user", columnList = "user_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(length = 10)
    private String bloodGroup;

    @OneToMany(mappedBy = "patientProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientCondition> conditions = new ArrayList<>();

    @OneToMany(mappedBy = "patientProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientAllergy> allergies = new ArrayList<>();

    @OneToMany(mappedBy = "patientProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientMedication> medications = new ArrayList<>();

    @OneToMany(mappedBy = "patientProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientEmergencyContact> emergencyContacts = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
