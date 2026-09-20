package com.healthcare.triage.patient;

import com.healthcare.triage.auth.UserPrincipal;
import com.healthcare.triage.common.ApiResponse;
import com.healthcare.triage.patient.dto.PatientProfileDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<PatientProfileDto>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        PatientProfileDto dto = patientService.getProfileByUserId(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<PatientProfileDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PatientProfileDto dto) {
        PatientProfileDto updated = patientService.updateProfile(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @DeleteMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> deleteMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        patientService.deletePatientAccount(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Account and medical profile deleted successfully", null));
    }

    @PostMapping("/conditions")
    public ResponseEntity<ApiResponse<PatientProfileDto.ConditionDto>> addCondition(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PatientProfileDto.ConditionDto dto) {
        PatientProfileDto.ConditionDto created = patientService.addCondition(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Condition added", created));
    }

    @PostMapping("/allergies")
    public ResponseEntity<ApiResponse<PatientProfileDto.AllergyDto>> addAllergy(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PatientProfileDto.AllergyDto dto) {
        PatientProfileDto.AllergyDto created = patientService.addAllergy(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Allergy recorded", created));
    }

    @PostMapping("/medications")
    public ResponseEntity<ApiResponse<PatientProfileDto.MedicationDto>> addMedication(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PatientProfileDto.MedicationDto dto) {
        PatientProfileDto.MedicationDto created = patientService.addMedication(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Medication recorded", created));
    }

    @PostMapping("/emergency-contacts")
    public ResponseEntity<ApiResponse<PatientProfileDto.EmergencyContactDto>> addEmergencyContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PatientProfileDto.EmergencyContactDto dto) {
        PatientProfileDto.EmergencyContactDto created = patientService.addEmergencyContact(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Emergency contact added", created));
    }

    @PostMapping("/consent")
    public ResponseEntity<ApiResponse<Void>> recordConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> consentData,
            HttpServletRequest request) {
        String consentType = (String) consentData.getOrDefault("consentType", "TRIAGE_DATA_PROCESSING");
        String version = (String) consentData.getOrDefault("version", "v1.0");
        boolean granted = Boolean.TRUE.equals(consentData.get("granted"));
        String ipAddress = request.getRemoteAddr();

        patientService.recordConsent(principal.getId(), consentType, version, granted, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Consent recorded", null));
    }

    @GetMapping("/consent")
    public ResponseEntity<ApiResponse<List<ConsentRecord>>> getConsentRecords(@AuthenticationPrincipal UserPrincipal principal) {
        List<ConsentRecord> records = patientService.getConsentRecords(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/{profileId}")
    @PreAuthorize("hasAnyRole('CLINICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientProfileDto>> getProfileByAdmin(@PathVariable Long profileId) {
        PatientProfileDto dto = patientService.getProfileById(profileId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
