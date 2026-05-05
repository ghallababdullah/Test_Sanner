package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnalyticsItemResponse {
    private Integer questionNumber;
    private Integer totalAnswers;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private BigDecimal averageScore;
    private BigDecimal accuracyPercentage;
}
