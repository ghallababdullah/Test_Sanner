package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response for scan session
 * Contains metadata about scanning session, not processing statistics
 */
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

    private LocalDateTime startedAt;

    private Object metadata; // Metadata as JSON (parsed from string in entity)

    private LocalDateTime createdAt;
}
