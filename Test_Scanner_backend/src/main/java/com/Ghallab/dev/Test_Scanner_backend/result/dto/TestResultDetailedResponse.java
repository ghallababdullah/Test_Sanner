package com.Ghallab.dev.Test_Scanner_backend.result.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestResultDetailedResponse {

    private UUID id;

    private UUID scannedBlankId;

    private UUID testId;

    private BigDecimal totalScore;

    private BigDecimal maxScore;

    private BigDecimal percentage;

    private String grade;

    private String status;

    private List<StudentAnswerResponse> studentAnswers;

    private LocalDateTime createdAt;
}

