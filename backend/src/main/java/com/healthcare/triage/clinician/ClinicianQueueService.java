package com.healthcare.triage.clinician;

import com.healthcare.triage.audit.AuditLogService;
import com.healthcare.triage.auth.User;
import com.healthcare.triage.auth.UserRepository;
import com.healthcare.triage.common.InvalidStateTransitionException;
import com.healthcare.triage.common.ResourceNotFoundException;
import com.healthcare.triage.common.TriagePriority;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.common.ValidationException;
import com.healthcare.triage.clinician.dto.ClinicianReviewDto;
import com.healthcare.triage.intake.TriageSession;
import com.healthcare.triage.intake.TriageSessionRepository;
import com.healthcare.triage.intake.dto.TriageSessionResponseDto;
import com.healthcare.triage.intake.TriageService;
import com.healthcare.triage.websocket.TriageEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicianQueueService {

    private final TriageSessionRepository sessionRepository;
    private final ClinicianReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final TriageService triageService;
    private final AuditLogService auditLogService;
    private final TriageEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<TriageSessionResponseDto> getActiveQueue() {
        List<TriageState> activeStates = List.of(
                TriageState.EMERGENCY_DECLARED,
                TriageState.URGENT_TRIAGED,
                TriageState.CONFLICT_DETECTED,
                TriageState.INSUFFICIENT_INFO_FLAGGED,
                TriageState.AWAITING_CLINICIAN_REVIEW,
                TriageState.ROUTINE_TRIAGED,
                TriageState.CLINICIAN_OVERRIDDEN,
                TriageState.CLINICIAN_ACCEPTED
        );

        return sessionRepository.findByStatusInOrderByCreatedAtDesc(activeStates)
                .stream()
                .map(triageService::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClinicianReviewDto submitReview(Long clinicianUserId, ClinicianReviewDto dto, String ipAddress, String correlationId) {
        User clinician = userRepository.findById(clinicianUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", clinicianUserId));

        TriageSession session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("TriageSession", "id", dto.getSessionId()));

        TriagePriority originalPriority = session.getFinalPriority();
        TriagePriority newPriority = dto.getFinalPriority();
        String actionType = dto.getActionType().toUpperCase();

        TriageState nextState;

        if ("OVERRIDE".equals(actionType)) {
            if (dto.getOverrideReason() == null || dto.getOverrideReason().trim().isBlank()) {
                throw new ValidationException("Mandatory clinical override reason must be documented.");
            }
            session.setFinalPriority(newPriority != null ? newPriority : originalPriority);
            nextState = TriageState.CLINICIAN_OVERRIDDEN;
        } else if ("ESCALATE".equals(actionType)) {
            session.setFinalPriority(TriagePriority.EMERGENCY);
            nextState = TriageState.EMERGENCY_DECLARED;
        } else if ("RESOLVE".equals(actionType)) {
            nextState = TriageState.RESOLVED;
            session.setCompletedAt(java.time.Instant.now());
        } else {
            // ACCEPT
            nextState = TriageState.CLINICIAN_ACCEPTED;
        }

        if (!session.getStatus().canTransitionTo(nextState)) {
            throw new InvalidStateTransitionException(session.getStatus(), nextState);
        }

        session.setStatus(nextState);
        sessionRepository.save(session);

        ClinicianReview review = ClinicianReview.builder()
                .triageSession(session)
                .clinician(clinician)
                .actionType(actionType)
                .originalPriority(originalPriority)
                .finalPriority(session.getFinalPriority())
                .overrideReason(dto.getOverrideReason())
                .clinicalNotes(dto.getClinicalNotes())
                .build();

        ClinicianReview savedReview = reviewRepository.save(review);

        // Audit Log
        auditLogService.logEvent(
                correlationId,
                clinician.getId(),
                clinician.getRole().name(),
                "OVERRIDE".equals(actionType) ? "CLINICIAN_OVERRIDE" : "CLINICIAN_REVIEW_COMPLETED",
                "TriageSession",
                session.getId().toString(),
                String.format("{\"action\":\"%s\",\"origPriority\":\"%s\",\"finalPriority\":\"%s\",\"reason\":\"%s\"}",
                        actionType, originalPriority, session.getFinalPriority(), dto.getOverrideReason() != null ? dto.getOverrideReason() : ""),
                ipAddress
        );

        // Live Event Broadcast
        eventPublisher.broadcastTriageUpdate(TriageEventPublisher.LiveTriageEvent.builder()
                .eventType(nextState.name())
                .sessionId(session.getId())
                .sessionCode(session.getSessionCode())
                .patientName(session.getPatientProfile().getUser().getFullName())
                .priority(session.getFinalPriority().name())
                .status(nextState.name())
                .primarySymptom(session.getPrimarySymptom())
                .triggeredRule("CLINICIAN_REVIEW_" + actionType)
                .requiresAttention(session.getFinalPriority() != TriagePriority.NORMAL)
                .build());

        return ClinicianReviewDto.builder()
                .id(savedReview.getId())
                .sessionId(session.getId())
                .clinicianId(clinician.getId())
                .clinicianName(clinician.getFullName())
                .actionType(savedReview.getActionType())
                .originalPriority(savedReview.getOriginalPriority())
                .finalPriority(savedReview.getFinalPriority())
                .overrideReason(savedReview.getOverrideReason())
                .clinicalNotes(savedReview.getClinicalNotes())
                .reviewTimestamp(savedReview.getReviewTimestamp())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ClinicianReviewDto> getReviewsForSession(Long sessionId) {
        return reviewRepository.findByTriageSessionIdOrderByReviewTimestampDesc(sessionId)
                .stream()
                .map(r -> ClinicianReviewDto.builder()
                        .id(r.getId())
                        .sessionId(r.getTriageSession().getId())
                        .clinicianId(r.getClinician().getId())
                        .clinicianName(r.getClinician().getFullName())
                        .actionType(r.getActionType())
                        .originalPriority(r.getOriginalPriority())
                        .finalPriority(r.getFinalPriority())
                        .overrideReason(r.getOverrideReason())
                        .clinicalNotes(r.getClinicalNotes())
                        .reviewTimestamp(r.getReviewTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
}
