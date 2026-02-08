package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request to submit scanned blank with extracted OCR data
 * Frontend performs OCR on the phone, backend only saves the data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadScannedBlankRequest {

    @NotNull(message = "Scan session ID is required")
    private UUID scanSessionId;

    @NotNull(message = "Test ID is required")
    private UUID testId;

    @NotBlank(message = "Student name is required")
    private String studentName;

    private String studentLastName;

    private String studentClass;

    private LocalDate testDate;

    @NotNull(message = "Answers are required")
    private Object answers; // {questionNumber: extractedAnswer, confidence} - will be serialized to JSON string

    @DecimalMin(value = "0")
    @DecimalMax(value = "1")
    private BigDecimal overallConfidence; // OCR quality from frontend

    private Object errorCorrections; // Optional corrections from student - will be serialized to JSON string

    private Boolean isErrorCorrectionApplied = false;
}
