package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestAnalyticsSummaryResponse {
    private UUID testId;
    private String title;
    private String subject;
    private String classLevel;
    private Integer totalScannedBlanks;
    private Integer scoredBlanks;
    private Integer needsReviewCount;
    private BigDecimal averageScore;
    private BigDecimal averagePercentage;
    private List<GradeDistributionItemResponse> gradeDistribution;
    private List<QuestionAnalyticsItemResponse> topMostIncorrectQuestions;
    private List<TopPerformerResponse> topPerformers;
}
