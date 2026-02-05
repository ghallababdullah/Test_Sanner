package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScanSessionResponse {

    private UUID id;

    private UUID testId;

    private UUID userId;

    private String name;

    private String description;

    private String deviceId;

    private String deviceModel;

    private Integer totalBlanks;

    private Integer processedBlanks;

    private Integer failedBlanks;

    private String status;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private Integer processingTimeMs;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long version;
}

