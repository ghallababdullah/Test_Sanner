package com.Ghallab.dev.Test_Scanner_backend.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * StudentAnswerResponse DTO - Details of each answer in grading response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerResponse {

    private Integer questionNumber;
    private String studentAnswer;
    private String correctAnswer;

    private BigDecimal pointsEarned;
    private BigDecimal maxPoints;

    private Integer distance; // Levenshtein distance
    private Boolean isCorrect;
    private String matchType; // EXACT, TOLERANCE_1, TOLERANCE_2, NO_MATCH
}

