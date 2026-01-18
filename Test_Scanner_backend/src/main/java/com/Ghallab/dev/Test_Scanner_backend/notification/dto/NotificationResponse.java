package com.Ghallab.dev.Test_Scanner_backend.notification.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;

    private UUID userId;

    private String type;

    private String title;

    private String message;

    private Boolean isRead;

    private Boolean isArchived;

    private LocalDateTime readAt;

    private String linkUrl;

    private String linkLabel;

    private JsonNode metadata;

    private LocalDateTime createdAt;
}

