package com.healthcare.triage.intake;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TriageDecisionTraceRepository extends JpaRepository<TriageDecisionTrace, Long> {
    Optional<TriageDecisionTrace> findByTriageSessionId(Long sessionId);
}
