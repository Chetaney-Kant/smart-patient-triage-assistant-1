package com.healthcare.triage.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String specialization;
    private String availabilityStatus;
    private long activeCasesCount;
    private boolean active;
}
