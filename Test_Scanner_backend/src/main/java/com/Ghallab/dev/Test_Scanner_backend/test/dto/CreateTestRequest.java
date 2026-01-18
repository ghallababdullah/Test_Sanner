package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTestRequest {

    @NotBlank(message = "Test title is required")
    private String title;

    private String subject;

    private String description;

    @Min(value = 1, message = "Total questions must be at least 1")
    @Max(value = 32, message = "Total questions cannot exceed 32")
    @NotNull(message = "Total questions is required")
    private Integer totalQuestions;

    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.01", message = "Max score must be greater than 0")
    private BigDecimal maxScore;
}

