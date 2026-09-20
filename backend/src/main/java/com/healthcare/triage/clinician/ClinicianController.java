package com.healthcare.triage.clinician;

import com.healthcare.triage.auth.UserPrincipal;
import com.healthcare.triage.common.ApiResponse;
import com.healthcare.triage.clinician.dto.ClinicianReviewDto;
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
@RequestMapping("/api/clinician")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CLINICIAN', 'ADMIN')")
public class ClinicianController {

    private final ClinicianQueueService clinicianQueueService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<TriageSessionResponseDto>>> getActiveQueue() {
        List<TriageSessionResponseDto> queue = clinicianQueueService.getActiveQueue();
        return ResponseEntity.ok(ApiResponse.ok("Live triage queue retrieved", queue));
    }

    @PostMapping("/review")
    public ResponseEntity<ApiResponse<ClinicianReviewDto>> submitReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ClinicianReviewDto reviewDto,
            HttpServletRequest request) {

        String ip = request.getRemoteAddr();
        String correlationId = request.getHeader("X-Correlation-Id");

        ClinicianReviewDto result = clinicianQueueService.submitReview(principal.getId(), reviewDto, ip, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Clinical review processed successfully", result));
    }

    @GetMapping("/session/{sessionId}/reviews")
    public ResponseEntity<ApiResponse<List<ClinicianReviewDto>>> getSessionReviews(@PathVariable Long sessionId) {
        List<ClinicianReviewDto> reviews = clinicianQueueService.getReviewsForSession(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(reviews));
    }
}
