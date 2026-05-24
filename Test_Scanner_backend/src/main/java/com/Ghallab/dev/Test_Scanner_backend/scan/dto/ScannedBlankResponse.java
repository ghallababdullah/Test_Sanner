package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response for scanned blank - contains ONLY raw OCR data
 * No grading/scoring information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScannedBlankResponse {

    private UUID id;

    private UUID scanSessionId;

    private UUID testId;

    private String studentName;

    private String studentClass;

    private LocalDate testDate;

    private String originalImagePath;

    private String processedImagePath;

    private String thumbnailPath;

    private String processingStatus;

    private String processingError;

    // OCR Quality
    private BigDecimal overallConfidence;

    // Scoring summary
    private String grade;

    private BigDecimal percentage;

    private Boolean needsReview;

    private String reviewStatus;

    // Raw answers (deserialized from JSON strings)
    private Object answers;

    private Object errorCorrections;

    private Boolean isErrorCorrectionApplied;

    // Timestamps
    private LocalDateTime scannedAt;

    private LocalDateTime processedAt;

    private LocalDateTime ocrStartedAt;

    private LocalDateTime ocrCompletedAt;

    private LocalDateTime reviewedAt;
}

