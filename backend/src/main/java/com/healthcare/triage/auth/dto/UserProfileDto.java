package com.healthcare.triage.auth.dto;

import com.healthcare.triage.common.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String email;
    private String fullName;
    private UserRole role;
    private String phone;
    private boolean active;
    private Long patientProfileId;
    private Instant createdAt;
}
