package com.healthcare.triage.intake;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TriageVitalsRepository extends JpaRepository<TriageVitals, Long> {
    Optional<TriageVitals> findByTriageSessionId(Long sessionId);
}
