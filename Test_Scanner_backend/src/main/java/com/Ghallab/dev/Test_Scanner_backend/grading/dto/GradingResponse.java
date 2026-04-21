package com.Ghallab.dev.Test_Scanner_backend.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * GradingResponse DTO - Output for grading evaluation
 * Contains the grading result and detailed answer information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingResponse {

    private UUID gradingResultId;
    private UUID testId;
    private String userEmail;

    // Student information from the blank
    private String studentName;
    private String studentLastName;
    private String studentClass;

    // Test information
    private String testClass; // The class this test is intended for
    private Boolean classMatchesStudent; // true if testClass matches studentClass, false if mismatch, null if either is missing

    private BigDecimal rawScore;
    private BigDecimal maxScore;
    private BigDecimal percentage;
    private String grade;

    private String feedback;
    private List<StudentAnswerResponse> answerDetails;
}
