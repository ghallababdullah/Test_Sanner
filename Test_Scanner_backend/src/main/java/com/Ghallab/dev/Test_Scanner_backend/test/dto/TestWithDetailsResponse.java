package com.Ghallab.dev.Test_Scanner_backend.test.dto;

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
public class TestWithDetailsResponse {

    private UUID id;

    private String title;

    private String subject;

    private String description;

    private Integer totalQuestions;

    private BigDecimal maxScore;

    private Boolean isActive;

    private UUID creatorId;
    private String classLevel;

    private LocalDateTime createdAt;

    private List<AnswerKeyResponse> answerKeys;

    private List<GradeThresholdResponse> gradeThresholds;
}

