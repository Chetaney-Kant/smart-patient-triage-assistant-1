package com.healthcare.triage.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Instant> verifiedRegistrations = new ConcurrentHashMap<>();

    private static final long OTP_VALIDITY_SECONDS = 600; // 10 minutes
    private static final long VERIFIED_WINDOW_SECONDS = 1800; // 30 minutes
    private static final int MAX_ATTEMPTS = 5;

    public record OtpRecord(String code, Instant expiresAt, int attempts) {
        public OtpRecord withIncrementedAttempts() {
            return new OtpRecord(code, expiresAt, attempts + 1);
        }
    }

    public String generateAndSendOtp(String email, String purpose) {
        String normalizedEmail = email.trim().toLowerCase();
        String key = normalizedEmail + ":" + purpose.toUpperCase();

        int otpNum = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpNum);

        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);
        otpStore.put(key, new OtpRecord(otpCode, expiresAt, 0));

        emailService.sendOtpEmail(normalizedEmail, otpCode, purpose);
        return otpCode;
    }

    public boolean isEmailRegistrationVerified(String email) {
        if (email == null) return false;
        String normalizedEmail = email.trim().toLowerCase();
        Instant expiry = verifiedRegistrations.get(normalizedEmail);
        return expiry != null && Instant.now().isBefore(expiry);
    }

    public boolean verifyOtp(String email, String inputCode, String purpose) {
        if (inputCode == null || inputCode.trim().isEmpty()) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String key = normalizedEmail + ":" + purpose.toUpperCase();
        OtpRecord record = otpStore.get(key);

        if (record == null) {
            log.warn("OTP verification failed: No active OTP record for {}", key);
            return false;
        }

        if (Instant.now().isAfter(record.expiresAt())) {
            log.warn("OTP verification failed: OTP expired for {}", key);
            otpStore.remove(key);
            return false;
        }

        if (record.attempts() >= MAX_ATTEMPTS) {
            log.warn("OTP verification failed: Max attempts exceeded for {}", key);
            otpStore.remove(key);
            return false;
        }

        if (record.code().equals(inputCode.trim())) {
            log.info("✅ OTP verified successfully for {} [{}]", normalizedEmail, purpose);
            otpStore.remove(key);
            if ("REGISTRATION".equalsIgnoreCase(purpose)) {
                verifiedRegistrations.put(normalizedEmail, Instant.now().plusSeconds(VERIFIED_WINDOW_SECONDS));
            }
            return true;
        } else {
            otpStore.put(key, record.withIncrementedAttempts());
            log.warn("OTP verification mismatch for {}. Attempt: {}/{}", key, record.attempts() + 1, MAX_ATTEMPTS);
            return false;
        }
    }
}
