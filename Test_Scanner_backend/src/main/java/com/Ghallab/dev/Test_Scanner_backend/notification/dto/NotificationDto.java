package com.Ghallab.dev.Test_Scanner_backend.notification.dto;

import com.Ghallab.dev.Test_Scanner_backend.notification.domain.entity.Notification;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Notification.NotificationType type;
    private String recipient ;
    private String title;
    private String message;
    private LocalDateTime createdAt;
    private String templateName ;
    private Map<String , Object> templateVariable ;
}
