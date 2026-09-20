package com.healthcare.triage.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientEmergencyContactRepository extends JpaRepository<PatientEmergencyContact, Long> {
    List<PatientEmergencyContact> findByPatientProfileId(Long profileId);
    Optional<PatientEmergencyContact> findByPatientProfileIdAndPrimaryContactTrue(Long profileId);
}
