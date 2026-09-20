package com.healthcare.triage.emergency;

import com.healthcare.triage.audit.AuditLogService;
import com.healthcare.triage.common.ResourceNotFoundException;
import com.healthcare.triage.common.TriageState;
import com.healthcare.triage.intake.TriageSession;
import com.healthcare.triage.intake.TriageSessionRepository;
import com.healthcare.triage.patient.PatientEmergencyContact;
import com.healthcare.triage.patient.PatientEmergencyContactRepository;
import com.healthcare.triage.websocket.TriageEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyService {

    private final EmergencyIncidentRepository incidentRepository;
    private final EmergencyNotificationRepository notificationRepository;
    private final TriageSessionRepository sessionRepository;
    private final PatientEmergencyContactRepository emergencyContactRepository;
    private final AuditLogService auditLogService;
    private final TriageEventPublisher eventPublisher;

    @Value("${app.emergency.helpline-number:112}")
    private String emergencyHelpline;

    @Value("${app.emergency.ambulance-number:108}")
    private String ambulanceNumber;

    @Transactional
    public EmergencyIncident dispatchEmergency(Long sessionId, String departmentCode, String ipAddress, String correlationId) {
        TriageSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TriageSession", "id", sessionId));

        Optional<EmergencyIncident> existing = incidentRepository.findByTriageSessionId(sessionId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String incidentCode = "INC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        String dept = (departmentCode != null && !departmentCode.isBlank()) ? departmentCode : "ER-RESUSCITATION";

        EmergencyIncident incident = EmergencyIncident.builder()
                .incidentCode(incidentCode)
                .triageSession(session)
                .severityLevel("CRITICAL")
                .status("DISPATCHED")
                .departmentCode(dept)
                .build();

        EmergencyIncident saved = incidentRepository.save(incident);

        // Update Session State
        session.setStatus(TriageState.EMERGENCY_DISPATCHED);
        sessionRepository.save(session);

        // 1. Dispatch Simulated Hospital Alert
        EmergencyNotification hospitalAlert = EmergencyNotification.builder()
                .incident(saved)
                .recipientType("HOSPITAL_ER")
                .destination("Department: " + dept)
                .channel("DASHBOARD")
                .message(String.format("[SIMULATED] Critical Patient Incoming: %s (Symptom: %s, Acuity: EMERGENCY)",
                        session.getPatientProfile().getUser().getFullName(), session.getPrimarySymptom()))
                .status("SENT")
                .simulatedFlag(true)
                .build();
        notificationRepository.save(hospitalAlert);

        // 2. Dispatch Simulated Emergency Contact SMS
        List<PatientEmergencyContact> contacts = emergencyContactRepository.findByPatientProfileId(session.getPatientProfile().getId());
        for (PatientEmergencyContact contact : contacts) {
            EmergencyNotification contactAlert = EmergencyNotification.builder()
                    .incident(saved)
                    .recipientType("EMERGENCY_CONTACT")
                    .destination(contact.getPhone() + " (" + contact.getContactName() + ")")
                    .channel("SMS")
                    .message(String.format("[SIMULATED SMS to %s]: Urgent medical triage alert for %s. Emergency services coordinated.",
                            contact.getContactName(), session.getPatientProfile().getUser().getFullName()))
                    .status("DELIVERED")
                    .simulatedFlag(true)
                    .build();
            notificationRepository.save(contactAlert);
        }

        // Audit Log
        auditLogService.logEvent(
                correlationId,
                session.getPatientProfile().getUser().getId(),
                "SYSTEM",
                "EMERGENCY_INCIDENT_DISPATCHED",
                "EmergencyIncident",
                saved.getId().toString(),
                String.format("{\"incidentCode\":\"%s\",\"dept\":\"%s\"}", incidentCode, dept),
                ipAddress
        );

        // STOMP Broadcast
        eventPublisher.broadcastTriageUpdate(TriageEventPublisher.LiveTriageEvent.builder()
                .eventType("EMERGENCY_DISPATCHED")
                .sessionId(session.getId())
                .sessionCode(session.getSessionCode())
                .patientName(session.getPatientProfile().getUser().getFullName())
                .priority("EMERGENCY")
                .status("EMERGENCY_DISPATCHED")
                .primarySymptom(session.getPrimarySymptom())
                .triggeredRule("EMERGENCY_DISPATCH_PROTOCOL")
                .requiresAttention(true)
                .build());

        return saved;
    }

    @Transactional
    public EmergencyIncident resolveIncident(Long incidentId, String notes, Long resolverUserId) {
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("EmergencyIncident", "id", incidentId));

        incident.setStatus("RESOLVED");
        incident.setResolutionNotes(notes);
        incident.setResolvedAt(Instant.now());

        TriageSession session = incident.getTriageSession();
        if (session != null) {
            session.setStatus(TriageState.RESOLVED);
            sessionRepository.save(session);
        }

        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public List<EmergencyIncident> getActiveIncidents() {
        return incidentRepository.findAllByOrderByDispatchTimestampDesc();
    }

    @Transactional(readOnly = true)
    public List<EmergencyNotification> getRecentNotifications() {
        return notificationRepository.findTop50ByOrderBySentAtDesc();
    }
}
