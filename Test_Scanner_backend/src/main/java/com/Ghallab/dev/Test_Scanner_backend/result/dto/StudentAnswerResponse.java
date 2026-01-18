package com.Ghallab.dev.Test_Scanner_backend.result.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswerResponse {

    private UUID id;

    private UUID scannedBlankId;

    private Integer questionNumber;

    private String correctAnswer;

    private String studentAnswer;

    private String finalAnswer;

    private BigDecimal score;

    private BigDecimal maxPoints;

    private String matchType;

    private LocalDateTime createdAt;
}

