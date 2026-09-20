package com.healthcare.triage.intake;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TriageSymptomResponseRepository extends JpaRepository<TriageSymptomResponse, Long> {
    List<TriageSymptomResponse> findByTriageSessionId(Long sessionId);
}
