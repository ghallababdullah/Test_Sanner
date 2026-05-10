package com.Ghallab.dev.Test_Scanner_backend.site.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
import com.Ghallab.dev.Test_Scanner_backend.notification.domain.service.NotificationService;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;
import com.Ghallab.dev.Test_Scanner_backend.site.dto.SiteContactRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteContactServiceImpl implements SiteContactService {

    private final NotificationService notificationService;

    @Value("${app.site.support-email:${MAIL_USERNAME:ghallabdev@gmail.com}}")
    private String supportEmail;

    @Value("${app.site.partnership-email:${MAIL_USERNAME:ghallabdev@gmail.com}}")
    private String partnershipEmail;

    @Value("${app.site.company-name:Галлаб Абдулла}")
    private String companyName;

    @Value("${app.mail.name:СканПроверка}")
    private String productName;

    @Override
    public Response<String> sendContactMessage(SiteContactRequest request) {
        String normalizedType = normalizeType(request.getType());
        String recipient = resolveRecipient(normalizedType);
        String titlePrefix = "SUPPORT".equals(normalizedType) ? "Техническая поддержка" : "Сотрудничество";

        NotificationDto incomingMessage = NotificationDto.builder()
                .recipient(recipient)
                .title(titlePrefix + " | " + request.getSubject().trim())
                .message(buildIncomingHtmlMessage(normalizedType, request))
                .build();

        NotificationDto confirmationMessage = NotificationDto.builder()
                .recipient(request.getEmail().trim())
                .title("Мы получили ваше сообщение | " + productName)
                .message(buildConfirmationHtmlMessage(normalizedType, request))
                .build();

        notificationService.sendEmailAsync(incomingMessage);
        notificationService.sendEmailAsync(confirmationMessage);
        log.info("Site contact message queued. type={} from={}", normalizedType, request.getEmail());

        return Response.success("Сообщение отправлено", "Сообщение успешно отправлено");
    }

    private String normalizeType(String rawType) {
        if (rawType == null) {
            throw new BadRequestException("Contact type is required");
        }

        String normalized = rawType.trim().toUpperCase();
        if (!"SUPPORT".equals(normalized) && !"COLLABORATION".equals(normalized)) {
            throw new BadRequestException("Unsupported contact type");
        }
        return normalized;
    }

    private String resolveRecipient(String type) {
        return "COLLABORATION".equals(type) ? partnershipEmail : supportEmail;
    }

    private String buildIncomingHtmlMessage(String type, SiteContactRequest request) {
        String sectionTitle = "COLLABORATION".equals(type) ? "Запрос на сотрудничество" : "Запрос в техническую поддержку";
        String organization = request.getOrganization() == null || request.getOrganization().isBlank()
                ? "Не указана"
                : escapeHtml(request.getOrganization().trim());

        return """
                <div style="font-family:Arial,sans-serif;color:#161d27;line-height:1.6">
                  <h2 style="margin:0 0 16px 0;">%s</h2>
                  <p style="margin:0 0 20px 0;">Сообщение отправлено через сайт <strong>%s</strong>.</p>
                  <p style="margin:0 0 20px 0;">Проект разработан лично <strong>%s</strong>.</p>
                  <table style="border-collapse:collapse;width:100%%;max-width:720px;">
                    <tr><td style="padding:8px 12px;border:1px solid #d8d3c8;"><strong>Имя</strong></td><td style="padding:8px 12px;border:1px solid #d8d3c8;">%s</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #d8d3c8;"><strong>Email</strong></td><td style="padding:8px 12px;border:1px solid #d8d3c8;">%s</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #d8d3c8;"><strong>Организация</strong></td><td style="padding:8px 12px;border:1px solid #d8d3c8;">%s</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #d8d3c8;"><strong>Тема</strong></td><td style="padding:8px 12px;border:1px solid #d8d3c8;">%s</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #d8d3c8;"><strong>Тип</strong></td><td style="padding:8px 12px;border:1px solid #d8d3c8;">%s</td></tr>
                  </table>
                  <div style="margin-top:20px;padding:16px;border:1px solid #d8d3c8;background:#fbf8f1;">
                    <strong>Сообщение</strong>
                    <p style="white-space:pre-wrap;margin:12px 0 0 0;">%s</p>
                  </div>
                </div>
                """.formatted(
                sectionTitle,
                escapeHtml(productName),
                escapeHtml(companyName),
                escapeHtml(request.getName().trim()),
                escapeHtml(request.getEmail().trim()),
                organization,
                escapeHtml(request.getSubject().trim()),
                "COLLABORATION".equals(type) ? "Сотрудничество" : "Техническая поддержка",
                escapeHtml(request.getMessage().trim())
        );
    }

    private String buildConfirmationHtmlMessage(String type, SiteContactRequest request) {
        String title = "COLLABORATION".equals(type) ? "Спасибо за интерес к сотрудничеству" : "Спасибо за обращение в поддержку";
        return """
                <div style="font-family:Arial,sans-serif;color:#161d27;line-height:1.6">
                  <h2 style="margin:0 0 16px 0;">%s</h2>
                  <p>Здравствуйте, %s.</p>
                  <p>Мы получили ваше сообщение по теме <strong>%s</strong>. Оно уже доставлено на <strong>%s</strong> и будет обработано в ближайшее время.</p>
                  <p>Система разработана лично <strong>%s</strong>.</p>
                  <p style="margin-top:24px;">С уважением,<br/>%s</p>
                </div>
                """.formatted(
                title,
                escapeHtml(request.getName().trim()),
                escapeHtml(request.getSubject().trim()),
                escapeHtml(supportEmail),
                escapeHtml(companyName),
                escapeHtml(productName)
        );
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
