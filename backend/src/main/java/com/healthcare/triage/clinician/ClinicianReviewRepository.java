package com.healthcare.triage.clinician;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicianReviewRepository extends JpaRepository<ClinicianReview, Long> {
    List<ClinicianReview> findByTriageSessionIdOrderByReviewTimestampDesc(Long sessionId);
    List<ClinicianReview> findByClinicianIdOrderByReviewTimestampDesc(Long clinicianId);
    long countByActionType(String actionType);
}
