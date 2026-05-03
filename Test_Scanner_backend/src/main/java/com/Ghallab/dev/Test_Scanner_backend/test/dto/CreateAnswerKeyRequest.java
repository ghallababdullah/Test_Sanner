package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnswerKeyRequest {

    private UUID testId;

    @NotNull(message = "Question number is required")
    @Min(value = 1, message = "Question number must be at least 1")
    @Max(value = 32, message = "Question number cannot exceed 32")
    private Integer questionNumber;

    @NotBlank(message = "Correct answer is required")
    private String correctAnswer;

    private BigDecimal maxPoints;

    private Integer toleranceLevel;

    private String answerType;
}

