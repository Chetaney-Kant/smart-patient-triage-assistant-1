package com.healthcare.triage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TriageAssistantApplication {

    public static void main(String[] args) {
        SpringApplication.run(TriageAssistantApplication.class, args);
    }
}
