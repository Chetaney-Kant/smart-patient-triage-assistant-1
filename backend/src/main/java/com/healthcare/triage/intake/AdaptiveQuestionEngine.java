package com.healthcare.triage.intake;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AdaptiveQuestionEngine {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdaptiveQuestion {
        private String questionId;
        private String category;
        private String questionText;
        private String responseType; // MULTIPLE_CHOICE, BOOLEAN, TEXT, SCALE_1_TO_10
        private List<String> options;
        private boolean isRedFlagTrigger;
    }

    public List<AdaptiveQuestion> getFollowUpQuestions(String primarySymptom, String bodyLocation, int severity1To10) {
        String symptom = (primarySymptom != null ? primarySymptom : "").toLowerCase(Locale.ROOT);
        String location = (bodyLocation != null ? bodyLocation : "").toLowerCase(Locale.ROOT);
        List<AdaptiveQuestion> questions = new ArrayList<>();

        if (symptom.contains("chest") || location.contains("chest")) {
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-CARDIO-01")
                    .category("CARDIOVASCULAR")
                    .questionText("Does the chest pain or discomfort radiate to your left arm, shoulder, neck, or jaw?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes", "No"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-CARDIO-02")
                    .category("CARDIOVASCULAR")
                    .questionText("Are you experiencing profuse cold sweating (diaphoresis) or sudden nausea?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes", "No"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-CARDIO-03")
                    .category("CARDIOVASCULAR")
                    .questionText("How would you describe the sensation?")
                    .responseType("MULTIPLE_CHOICE")
                    .options(List.of("Crushing / Heavy Pressure", "Sharp / Stabbing", "Burning / Acid Sensation", "Aching / Sore"))
                    .isRedFlagTrigger(false)
                    .build());
        } else if (symptom.contains("breath") || symptom.contains("cough") || symptom.contains("dyspnea")) {
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-RESP-01")
                    .category("RESPIRATORY")
                    .questionText("Are you able to speak a full sentence without gasping or stopping for air?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes (Can speak normally)", "No (Gasping between words)"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-RESP-02")
                    .category("RESPIRATORY")
                    .questionText("Have you noticed any bluish tint (cyanosis) around your lips or fingertips?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes", "No"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-RESP-03")
                    .category("RESPIRATORY")
                    .questionText("Do you hear a high-pitched wheezing or harsh whistling sound when breathing?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes", "No"))
                    .isRedFlagTrigger(false)
                    .build());
        } else if (symptom.contains("abdom") || symptom.contains("stomach") || symptom.contains("belly")) {
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-GI-01")
                    .category("GASTROINTESTINAL")
                    .questionText("Where exactly is the abdominal pain located?")
                    .responseType("MULTIPLE_CHOICE")
                    .options(List.of("Lower Right Side (RLQ)", "Upper Center / Epigastric", "Lower Left Side (LLQ)", "Generalized / All Over"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-GI-02")
                    .category("GASTROINTESTINAL")
                    .questionText("Are you experiencing persistent vomiting or inability to keep any fluids down for over 12 hours?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes", "No"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-GI-03")
                    .category("GASTROINTESTINAL")
                    .questionText("Is your abdomen unusually rigid, rock-hard, or severely tender when pressed and released?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes (Severe rebound tenderness)", "No"))
                    .isRedFlagTrigger(true)
                    .build());
        } else if (symptom.contains("head") || symptom.contains("dizz") || symptom.contains("neuro")) {
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-NEURO-01")
                    .category("NEUROLOGICAL")
                    .questionText("Did this headache onset suddenly with peak severity in seconds (Thunderclap headache)?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes (Sudden explosive onset)", "No (Gradual buildup)"))
                    .isRedFlagTrigger(true)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-NEURO-02")
                    .category("NEUROLOGICAL")
                    .questionText("Are you experiencing any facial drooping, one-sided arm weakness, or difficulty speaking clearly?")
                    .responseType("BOOLEAN")
                    .options(List.of("Yes (FAST Stroke symptoms)", "No"))
                    .isRedFlagTrigger(true)
                    .build());
        } else {
            // General adaptive baseline questions
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-GEN-01")
                    .category("GENERAL")
                    .questionText("Did the symptoms start abruptly within hours or develop gradually over several days?")
                    .responseType("MULTIPLE_CHOICE")
                    .options(List.of("Sudden onset (under 2 hours)", "Acute (within 24 hours)", "Subacute (2-7 days)", "Chronic (over 1 week)"))
                    .isRedFlagTrigger(false)
                    .build());
            questions.add(AdaptiveQuestion.builder()
                    .questionId("Q-GEN-02")
                    .category("GENERAL")
                    .questionText("Are your symptoms progressively getting worse, staying the same, or improving?")
                    .responseType("MULTIPLE_CHOICE")
                    .options(List.of("Rapidly worsening", "Steadily worsening", "Stable / Unchanged", "Improving"))
                    .isRedFlagTrigger(false)
                    .build());
        }

        return questions;
    }
}
