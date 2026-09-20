package com.healthcare.triage.safety;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SafetyRuleRepository extends JpaRepository<SafetyRule, Long> {
    Optional<SafetyRule> findByRuleCode(String ruleCode);
    List<SafetyRule> findByIsActiveTrue();
    List<SafetyRule> findByCategoryAndIsActiveTrue(String category);
}
