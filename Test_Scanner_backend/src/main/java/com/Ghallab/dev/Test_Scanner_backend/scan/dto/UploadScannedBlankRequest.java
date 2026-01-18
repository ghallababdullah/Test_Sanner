package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

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

    private String studentClass;

    private LocalDate testDate;

    @NotNull(message = "Answers are required")
    private JsonNode answers;

    private String originalImagePath;
}

