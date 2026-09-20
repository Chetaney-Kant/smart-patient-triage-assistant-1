package com.healthcare.triage.auth;

import com.healthcare.triage.common.UserRole;
import com.healthcare.triage.patient.PatientProfile;
import com.healthcare.triage.patient.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplateBuilder().build();

    @Value("${app.oauth.google.client-id:}")
    private String configuredClientId;

    public record GoogleUserInfo(String email, String name, String sub, String picture) {}

    @Transactional
    public User processGoogleToken(String idToken) {
        GoogleUserInfo googleUser = verifyGoogleToken(idToken);
        if (googleUser == null || googleUser.email() == null) {
            throw new IllegalArgumentException("Invalid or expired Google OAuth token.");
        }

        String email = googleUser.email().trim().toLowerCase();
        return userRepository.findByEmail(email).orElseGet(() -> {
            log.info("Creating new patient account from Google OAuth: {}", email);
            User newUser = User.builder()
                    .email(email)
                    .fullName(googleUser.name() != null ? googleUser.name() : "Google User")
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(UserRole.ROLE_PATIENT)
                    .active(true)
                    .build();
            User savedUser = userRepository.save(newUser);

            PatientProfile profile = PatientProfile.builder()
                    .user(savedUser)
                    .gender("Prefer not to say")
                    .build();
            patientProfileRepository.save(profile);

            return savedUser;
        });
    }

    private GoogleUserInfo verifyGoogleToken(String token) {
        if (token == null || token.isBlank()) return null;

        // 1. Try validating via Google's id_token endpoint
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String email = (String) body.get("email");
                String name = (String) body.get("name");
                String sub = (String) body.get("sub");
                String picture = (String) body.get("picture");
                if (email != null) {
                    return new GoogleUserInfo(email, name, sub, picture);
                }
            }
        } catch (Exception ignored) {
        }

        // 2. Try validating via Google's access_token / userinfo endpoint
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(token);
            org.springframework.http.HttpEntity<Void> request = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange("https://www.googleapis.com/oauth2/v3/userinfo", org.springframework.http.HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String email = (String) body.get("email");
                String name = (String) body.get("name");
                String sub = (String) body.get("sub");
                String picture = (String) body.get("picture");
                if (email != null) {
                    return new GoogleUserInfo(email, name, sub, picture);
                }
            }
        } catch (Exception ignored) {
        }

        // 3. Fallback for mock/simulation testing if token is structured as "mock_google_token:email:name"
        if (token.startsWith("mock_google_token:")) {
            String[] parts = token.split(":");
            String email = parts.length > 1 ? parts[1] : "google_user@hospital.com";
            String name = parts.length > 2 ? parts[2] : "Google User";
            log.info("ℹ️ Using simulated Google OAuth login for dev testing: {}", email);
            return new GoogleUserInfo(email, name, "google_sub_" + email.hashCode(), null);
        }

        return null;
    }
}
