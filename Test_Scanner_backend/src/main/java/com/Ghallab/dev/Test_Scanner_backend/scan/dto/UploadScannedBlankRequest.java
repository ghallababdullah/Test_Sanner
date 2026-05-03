package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request to upload a scanned blank image for OCR processing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadScannedBlankRequest {

    @NotNull(message = "Scan session ID is required")
    private UUID scanSessionId;

    @NotNull(message = "Test ID is required")
    private UUID testId;

    private LocalDate testDate;

    @NotNull(message = "Image file is required")
    private MultipartFile image;
}
