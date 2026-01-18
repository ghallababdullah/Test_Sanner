package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerKeyResponse {

    private UUID id;

    private UUID testId;

    private Integer questionNumber;

    private String correctAnswer;

    private BigDecimal maxPoints;

    private Integer toleranceLevel;

    private String answerType;

    private LocalDateTime createdAt;
}

