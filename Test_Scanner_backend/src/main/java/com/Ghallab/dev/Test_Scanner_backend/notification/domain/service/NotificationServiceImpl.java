package com.Ghallab.dev.Test_Scanner_backend.notification.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.name}")
    private String fromName;

    @Override
    public void sendEmail(NotificationDto notificationDTO) {
        sendEmailInternal(notificationDTO);
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendEmailAsync(NotificationDto notificationDTO) {
        try {
            sendEmailInternal(notificationDTO);
        } catch (RuntimeException ex) {
            log.error("Async email sending failed for {}: {}", notificationDTO.getRecipient(), ex.getMessage(), ex);
        }
    }

    private void sendEmailInternal(NotificationDto notificationDTO) {
        try {
            log.info("Starting email send to: {} with subject: {}", notificationDTO.getRecipient(), notificationDTO.getTitle());

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, fromName);
            helper.setTo(notificationDTO.getRecipient());
            helper.setSubject(notificationDTO.getTitle());

            if (notificationDTO.getTemplateName() != null && !notificationDTO.getTemplateName().isEmpty()) {
                Context context = new Context();
                if (notificationDTO.getTemplateVariable() != null) {
                    context.setVariables(notificationDTO.getTemplateVariable());
                }
                String htmlContent = templateEngine.process(notificationDTO.getTemplateName(), context);
                helper.setText(htmlContent, true);
            } else {
                helper.setText(notificationDTO.getMessage(), true);
            }

            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", notificationDTO.getRecipient());
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", notificationDTO.getRecipient(), e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendEmailVerifiedNotification(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("teacherFirstName", user.getFirstName());

        NotificationDto email = NotificationDto.builder()
                .recipient(user.getEmail())
                .title("Email verified")
                .templateName("verify-email")
                .templateVariable(variables)
                .build();

        sendEmailAsync(email);
    }
}
