package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartScanSessionRequest {

    @NotNull(message = "Test ID is required")
    private UUID testId;

    private String name;

    private String description;

    private String deviceId;

    private String deviceModel;
}

