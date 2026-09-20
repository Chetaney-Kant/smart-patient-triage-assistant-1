package com.healthcare.triage.auth;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public boolean sendOtpEmail(String toEmail, String otpCode, String purpose) {
        log.info("================================================================================");
        log.info("📧 [CLINICAL EMAIL DISPATCH] OTP: [{}] | TO: [{}] | PURPOSE: [{}]", otpCode, toEmail, purpose);
        log.info("================================================================================");

        if (mailSender == null || fromEmail == null || fromEmail.trim().isEmpty()) {
            log.info("ℹ️ Live SMTP not configured. OTP [{}] logged for dev/testing.", otpCode);
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "MediTriage Clinical Portal");
            helper.setTo(toEmail);
            helper.setSubject("Your MediTriage Verification Code: " + otpCode);

            String htmlBody = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #2563eb; margin: 0; font-size: 24px;">MediTriage</h2>
                        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">AI-Assisted Clinical Triage & Patient Portal</p>
                    </div>
                    <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                        <p style="color: #334155; font-size: 14px; margin-bottom: 12px; font-weight: bold;">
                            Your %s Verification Code:
                        </p>
                        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; padding: 12px 0;">
                            %s
                        </div>
                        <p style="color: #64748b; font-size: 12px; margin-top: 8px;">
                            This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
                        </p>
                    </div>
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px;">
                        <p>Medical Disclaimer: MediTriage provides clinical decision support. If you are experiencing a life-threatening emergency, call 112 / 108 immediately.</p>
                    </div>
                </div>
            """.formatted(purpose, otpCode);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("✅ Live email successfully dispatched via SMTP to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ Could not send live email via SMTP ({}). Falling back to console OTP: [{}]", e.getMessage(), otpCode);
            return true;
        }
    }
}
