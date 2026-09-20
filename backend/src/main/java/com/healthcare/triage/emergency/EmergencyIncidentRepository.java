package com.healthcare.triage.emergency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyIncidentRepository extends JpaRepository<EmergencyIncident, Long> {
    Optional<EmergencyIncident> findByIncidentCode(String incidentCode);
    Optional<EmergencyIncident> findByTriageSessionId(Long sessionId);
    List<EmergencyIncident> findByStatusOrderByDispatchTimestampDesc(String status);
    List<EmergencyIncident> findAllByOrderByDispatchTimestampDesc();
}
