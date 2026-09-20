package com.healthcare.triage.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String password;
    private List<ConditionDto> conditions;
    private List<AllergyDto> allergies;
    private List<MedicationDto> medications;
    private List<EmergencyContactDto> emergencyContacts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionDto {
        private Long id;
        private String conditionName;
        private String category;
        private Integer diagnosedYear;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllergyDto {
        private Long id;
        private String allergen;
        private String reactionType;
        private String severityLevel;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicationDto {
        private Long id;
        private String medicationName;
        private String dosage;
        private String frequency;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyContactDto {
        private Long id;
        private String contactName;
        private String relationship;
        private String phone;
        private String email;
        private boolean primaryContact;
    }
}
