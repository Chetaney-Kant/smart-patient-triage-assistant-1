package com.healthcare.triage.intake;

import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TriageSessionRepository extends JpaRepository<TriageSession, Long> {
    Optional<TriageSession> findBySessionCode(String sessionCode);
    Optional<TriageSession> findByIdempotencyKey(String idempotencyKey);
    List<TriageSession> findByPatientProfileIdOrderByCreatedAtDesc(Long patientProfileId);
    Page<TriageSession> findByPatientProfileIdOrderByCreatedAtDesc(Long patientProfileId, Pageable pageable);
    List<TriageSession> findByAssignedClinicianId(Long clinicianId);
    List<TriageSession> findByStatusInOrderByCreatedAtDesc(List<TriageState> states);
    List<TriageSession> findByAssignedClinicianIdAndStatusInOrderByCreatedAtDesc(Long clinicianId, List<TriageState> states);
    long countByAssignedClinicianIdAndStatusIn(Long clinicianId, List<TriageState> states);
    long countByFinalPriority(TriagePriority priority);
    long countByStatus(TriageState status);
}
