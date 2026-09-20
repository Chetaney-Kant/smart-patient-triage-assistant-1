package com.healthcare.triage.safety;

import com.healthcare.triage.common.TriagePriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyEvaluationResult {
    private boolean isRedFlagTriggered;
    private TriagePriority deterministicPriority;
    private String triggeredRuleCode;
    private String ruleDescription;
    private String sourceGuideline;
    private String evidenceReference;
    private String ruleVersion;
    
    @Builder.Default
    private List<String> triggeringInputs = new ArrayList<>();
    
    @Builder.Default
    private List<String> detectedRedFlags = new ArrayList<>();

    public static SafetyEvaluationResult safe(String ruleVersion) {
        return SafetyEvaluationResult.builder()
                .isRedFlagTriggered(false)
                .deterministicPriority(TriagePriority.NORMAL)
                .ruleVersion(ruleVersion)
                .build();
    }
}
