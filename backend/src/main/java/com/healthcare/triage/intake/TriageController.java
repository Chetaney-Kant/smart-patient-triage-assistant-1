package com.healthcare.triage.intake;

import com.healthcare.triage.auth.UserPrincipal;
import com.healthcare.triage.common.ApiResponse;
import com.healthcare.triage.intake.dto.TriageIntakeRequest;
import com.healthcare.triage.intake.dto.TriageSessionResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/triage")
@RequiredArgsConstructor
public class TriageController {

    private final TriageService triageService;
    private final AdaptiveQuestionEngine questionEngine;

    @PostMapping("/intake")
    public ResponseEntity<ApiResponse<TriageSessionResponseDto>> submitIntake(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TriageIntakeRequest request,
            HttpServletRequest servletRequest) {

        String ip = servletRequest.getRemoteAddr();
        String correlationId = servletRequest.getHeader("X-Correlation-Id");

        TriageSessionResponseDto response = triageService.processIntake(principal.getId(), request, ip, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Triage intake assessed successfully", response));
    }

    @GetMapping("/adaptive-questions")
    public ResponseEntity<ApiResponse<List<AdaptiveQuestionEngine.AdaptiveQuestion>>> getAdaptiveQuestions(
            @RequestParam String primarySymptom,
            @RequestParam(required = false) String bodyLocation,
            @RequestParam(defaultValue = "5") int severity) {

        List<AdaptiveQuestionEngine.AdaptiveQuestion> questions =
                questionEngine.getFollowUpQuestions(primarySymptom, bodyLocation, severity);
        return ResponseEntity.ok(ApiResponse.ok(questions));
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<TriageSessionResponseDto>>> getMyTriageHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TriageSessionResponseDto> history = triageService.getPatientTriageHistory(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/session/{sessionCode}")
    public ResponseEntity<ApiResponse<TriageSessionResponseDto>> getSessionByCode(@PathVariable String sessionCode) {
        TriageSessionResponseDto session = triageService.getSessionByCode(sessionCode);
        return ResponseEntity.ok(ApiResponse.ok(session));
    }

    @GetMapping("/{sessionId}")
    @PreAuthorize("hasAnyRole('CLINICIAN', 'ADMIN', 'PATIENT')")
    public ResponseEntity<ApiResponse<TriageSessionResponseDto>> getSessionById(@PathVariable Long sessionId) {
        TriageSessionResponseDto session = triageService.getSessionById(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(session));
    }
}
