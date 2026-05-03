package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGradeThresholdRequest {

    private UUID testId;

    @NotBlank(message = "Grade name is required")
    private String gradeName;

    @NotBlank(message = "Grade symbol is required")
    private String gradeSymbol;

    @NotNull(message = "Min percentage is required")
    @Min(value = 0, message = "Min percentage must be at least 0")
    @Max(value = 100, message = "Min percentage cannot exceed 100")
    private Integer minPercentage;

    @NotNull(message = "Max percentage is required")
    @Min(value = 0, message = "Max percentage must be at least 0")
    @Max(value = 100, message = "Max percentage cannot exceed 100")
    private Integer maxPercentage;
}

