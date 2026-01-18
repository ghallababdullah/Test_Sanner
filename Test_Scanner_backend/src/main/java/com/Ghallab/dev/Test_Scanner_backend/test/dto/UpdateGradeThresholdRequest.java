package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGradeThresholdRequest {

    @Min(value = 0, message = "Min percentage must be at least 0")
    @Max(value = 100, message = "Min percentage cannot exceed 100")
    private Integer minPercentage;

    @Min(value = 0, message = "Max percentage must be at least 0")
    @Max(value = 100, message = "Max percentage cannot exceed 100")
    private Integer maxPercentage;
}

