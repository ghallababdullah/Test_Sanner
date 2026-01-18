package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAnswerKeyRequest {

    private String correctAnswer;

    private BigDecimal maxPoints;

    private Integer toleranceLevel;
}

