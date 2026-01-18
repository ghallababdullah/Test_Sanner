package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScannedBlankDetailedResponse {

    private UUID id;

    private UUID scanSessionId;

    private UUID testId;

    private String studentName;

    private String studentClass;

    private LocalDate testDate;

    private BigDecimal overallConfidence;

    private Boolean needsReview;

    private String reviewStatus;

    private JsonNode answers;

    private JsonNode errorCorrections;

    private JsonNode finalAnswers;

    private Boolean isScored;

    private BigDecimal rawScore;

    private BigDecimal maxScore;

    private BigDecimal percentage;

    private String grade;

    private String feedback;

    private String originalImagePath;

    private String processedImagePath;

    private String thumbnailPath;

    private LocalDateTime scannedAt;

    private LocalDateTime processedAt;

    private LocalDateTime scoredAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;
}

