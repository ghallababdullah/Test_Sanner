package com.Ghallab.dev.Test_Scanner_backend.security.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private UUID id;

    private UUID userId;

    private String userName;

    private UUID scanSessionId;

    private UUID blankId;

    private String action;

    private JsonNode details;

    private String ipAddress;

    private String userAgent;

    private LocalDateTime performedAt;
}

