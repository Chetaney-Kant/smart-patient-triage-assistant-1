package com.healthcare.triage.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientConditionRepository extends JpaRepository<PatientCondition, Long> {
    List<PatientCondition> findByPatientProfileId(Long profileId);
}
