package com.healthcare.triage.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientMedicationRepository extends JpaRepository<PatientMedication, Long> {
    List<PatientMedication> findByPatientProfileId(Long profileId);
}
