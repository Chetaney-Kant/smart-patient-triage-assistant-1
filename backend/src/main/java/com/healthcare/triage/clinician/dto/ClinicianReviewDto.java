package com.healthcare.triage.clinician.dto;

import com.healthcare.triage.common.TriagePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicianReviewDto {
    private Long id;
    
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    
    private Long clinicianId;
    private String clinicianName;
    
    @NotBlank(message = "Action type is required (ACCEPT, OVERRIDE, ESCALATE, HANDOFF)")
    private String actionType;
    
    private TriagePriority originalPriority;
    
    @NotNull(message = "Final priority is required")
    private TriagePriority finalPriority;
    
    private String overrideReason; // Required if actionType == OVERRIDE
    private String clinicalNotes;
    private Instant reviewTimestamp;
}
