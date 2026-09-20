package com.healthcare.triage.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDoctorRequest {
    @NotBlank(message = "Doctor full name is required")
    private String fullName;

    private String phone;

    @NotBlank(message = "Department is required")
    private String department;

    private String specialization;

    private String availabilityStatus;

    private String password;

    private Boolean active;
}
