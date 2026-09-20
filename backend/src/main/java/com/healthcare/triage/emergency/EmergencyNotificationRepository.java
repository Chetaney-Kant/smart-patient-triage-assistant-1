package com.healthcare.triage.emergency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyNotificationRepository extends JpaRepository<EmergencyNotification, Long> {
    List<EmergencyNotification> findByIncidentIdOrderBySentAtDesc(Long incidentId);
    List<EmergencyNotification> findTop50ByOrderBySentAtDesc();
}
