package com.healthcare.triage.emergency;

import com.healthcare.triage.auth.UserPrincipal;
import com.healthcare.triage.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMERGENCY_OPERATOR', 'CLINICIAN', 'ADMIN')")
public class EmergencyController {

    private final EmergencyService emergencyService;

    @PostMapping("/dispatch")
    public ResponseEntity<ApiResponse<EmergencyIncident>> dispatchEmergency(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Long sessionId = Long.valueOf(body.get("sessionId").toString());
        String dept = (String) body.getOrDefault("departmentCode", "ER-RESUSCITATION");
        String ip = request.getRemoteAddr();
        String cid = request.getHeader("X-Correlation-Id");

        EmergencyIncident incident = emergencyService.dispatchEmergency(sessionId, dept, ip, cid);
        return ResponseEntity.ok(ApiResponse.ok("Emergency incident dispatched successfully", incident));
    }

    @PostMapping("/incidents/{incidentId}/resolve")
    public ResponseEntity<ApiResponse<EmergencyIncident>> resolveIncident(
            @PathVariable Long incidentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        String notes = body.getOrDefault("notes", "Resolved by medical staff");
        EmergencyIncident resolved = emergencyService.resolveIncident(incidentId, notes, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Incident resolved", resolved));
    }

    @GetMapping("/incidents")
    public ResponseEntity<ApiResponse<List<EmergencyIncident>>> getIncidents() {
        List<EmergencyIncident> incidents = emergencyService.getActiveIncidents();
        return ResponseEntity.ok(ApiResponse.ok(incidents));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<EmergencyNotification>>> getNotifications() {
        List<EmergencyNotification> notifications = emergencyService.getRecentNotifications();
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }
}
