package com.Ghallab.dev.Test_Scanner_backend.notification.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.io.UnsupportedEncodingException;


import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender ;
    private final TemplateEngine templateEngine ;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.name}")
    private String fromName;


    @Override
    @Transactional
    public void sendEmail(NotificationDto notificationDTO) {
        try {
            log.info("📧 [SYNC] Starting email send to: {} with subject: {}",
                    notificationDTO.getRecipient(), notificationDTO.getTitle());
            log.info("📧 [SYNC] Template name: {}", notificationDTO.getTemplateName());
            log.info("📧 [SYNC] From: {} <{}>", fromName, fromEmail);


            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, fromName);
            helper.setTo(notificationDTO.getRecipient());
            helper.setSubject(notificationDTO.getTitle());
            if (notificationDTO.getTemplateName() != null && !notificationDTO.getTemplateName().isEmpty()) {
                log.info("📧 [SYNC] Processing Thymeleaf template: {}", notificationDTO.getTemplateName());
                Context context = new Context();
                if (notificationDTO.getTemplateVariable() != null) {
                    context.setVariables(notificationDTO.getTemplateVariable());
                    log.info("📧 [SYNC] Template variables set: {}", notificationDTO.getTemplateVariable().keySet());
                }
                String htmlContent = templateEngine.process(notificationDTO.getTemplateName(), context);
                log.info("📧 [SYNC] HTML content generated, length: {} chars", htmlContent.length());
                helper.setText(htmlContent, true);
            } else {
                log.info("📧 [SYNC] Using plain body instead of template");
                helper.setText(notificationDTO.getMessage(), true);
            }

            // ✅ ОТПРАВЛЯЕМ EMAIL
            mailSender.send(mimeMessage);
            log.info("✅ [SYNC] Email sent successfully to: {}", notificationDTO.getRecipient());

        }
        catch (MessagingException | UnsupportedEncodingException e) {
            log.error("❌ [SYNC] Failed to send email to {}: {}", notificationDTO.getRecipient(), e.getMessage(), e);
            log.error("❌ [SYNC] Exception type: {}", e.getClass().getName());
            log.error("❌ [SYNC] Stack trace: ", e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }

    }
    @Override
    public void sendEmailVerifiedNotification(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("teacherFirstName", user.getFirstName());

        NotificationDto email = NotificationDto.builder()
                .recipient(user.getEmail())
                .title("Email Verified - Waiting for Admin Approval")
                .templateName("verify-email")
                .templateVariable(variables)
                .build();

        sendEmail(email);
    }
}
