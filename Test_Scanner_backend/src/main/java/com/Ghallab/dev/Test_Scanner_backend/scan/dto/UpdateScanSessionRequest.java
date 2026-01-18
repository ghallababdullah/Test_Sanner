package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScanSessionRequest {

    private String status;

    private Integer totalBlanks;

    private Integer processedBlanks;

    private Integer failedBlanks;

    private Integer processingTimeMs;
}

