package com.healthcare.triage.admin;

import com.healthcare.triage.ai.AiServiceFactory;
import com.healthcare.triage.audit.AuditLog;
import com.healthcare.triage.audit.AuditLogService;
import com.healthcare.triage.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminAnalyticsService analyticsService;
    private final SystemSafetyTestRunner safetyTestRunner;
    private final AuditLogService auditLogService;
    private final AiServiceFactory aiServiceFactory;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminAnalyticsService.HospitalAnalyticsReport>> getAnalytics() {
        AdminAnalyticsService.HospitalAnalyticsReport report = analyticsService.getHospitalAnalytics();
        return ResponseEntity.ok(ApiResponse.ok("Hospital analytics retrieved", report));
    }

    @GetMapping("/doctors")
    public ResponseEntity<ApiResponse<List<com.healthcare.triage.admin.dto.DoctorDto>>> getAllDoctors() {
        List<com.healthcare.triage.admin.dto.DoctorDto> doctors = analyticsService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.ok("Doctor directory retrieved", doctors));
    }

    @PostMapping("/doctors")
    public ResponseEntity<ApiResponse<com.healthcare.triage.admin.dto.DoctorDto>> createDoctor(
            @jakarta.validation.Valid @RequestBody com.healthcare.triage.admin.dto.CreateDoctorRequest req) {
        com.healthcare.triage.admin.dto.DoctorDto created = analyticsService.createDoctor(req, passwordEncoder);
        return ResponseEntity.ok(ApiResponse.ok("Doctor registered successfully", created));
    }

    @PutMapping("/doctors/{id}")
    public ResponseEntity<ApiResponse<com.healthcare.triage.admin.dto.DoctorDto>> updateDoctor(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.healthcare.triage.admin.dto.UpdateDoctorRequest req) {
        com.healthcare.triage.admin.dto.DoctorDto updated = analyticsService.updateDoctor(id, req, passwordEncoder);
        return ResponseEntity.ok(ApiResponse.ok("Doctor details updated successfully", updated));
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDoctor(@PathVariable Long id) {
        analyticsService.deleteDoctor(id);
        return ResponseEntity.ok(ApiResponse.ok("Doctor removed successfully from active directory", "DELETED"));
    }

    @PatchMapping("/doctors/{id}/status")
    public ResponseEntity<ApiResponse<com.healthcare.triage.admin.dto.DoctorDto>> updateDoctorStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "AVAILABLE");
        com.healthcare.triage.admin.dto.DoctorDto updated = analyticsService.updateDoctorStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Doctor status updated", updated));
    }

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<com.healthcare.triage.admin.dto.AdminDto>>> getAllAdmins() {
        List<com.healthcare.triage.admin.dto.AdminDto> admins = analyticsService.getAllAdmins();
        return ResponseEntity.ok(ApiResponse.ok("Administrator directory retrieved", admins));
    }

    @PostMapping("/admins")
    public ResponseEntity<ApiResponse<com.healthcare.triage.admin.dto.AdminDto>> createAdmin(
            @jakarta.validation.Valid @RequestBody com.healthcare.triage.admin.dto.CreateAdminRequest req) {
        com.healthcare.triage.admin.dto.AdminDto created = analyticsService.createAdmin(req, passwordEncoder);
        return ResponseEntity.ok(ApiResponse.ok("Administrator registered successfully", created));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAdmin(@PathVariable Long id) {
        analyticsService.deleteAdmin(id);
        return ResponseEntity.ok(ApiResponse.ok("Administrator removed successfully", "DELETED"));
    }

    @PostMapping("/safety-suite/run")
    public ResponseEntity<ApiResponse<SystemSafetyTestRunner.SafetySuiteReport>> runSafetySuite() {
        SystemSafetyTestRunner.SafetySuiteReport report = safetyTestRunner.runCompleteSafetySuite();
        return ResponseEntity.ok(ApiResponse.ok("System safety suite executed", report));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        List<AuditLog> logs = auditLogService.getRecentAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @PostMapping("/system/ai-toggle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleAi(@RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        aiServiceFactory.setAiEnabled(enabled);
        return ResponseEntity.ok(ApiResponse.ok("AI status updated", Map.of(
                "aiEnabled", aiServiceFactory.isAiEnabled(),
                "activeProvider", aiServiceFactory.getActiveProvider().getProviderName()
        )));
    }

    @GetMapping("/system/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "backendStatus", "HEALTHY",
                "databaseStatus", "HEALTHY",
                "safetyEngineStatus", "ACTIVE",
                "aiKillSwitchActive", !aiServiceFactory.isAiEnabled(),
                "activeAiProvider", aiServiceFactory.getActiveProvider().getProviderName(),
                "ruleVersion", "v1.0.0-clinical-core"
        )));
    }
}
