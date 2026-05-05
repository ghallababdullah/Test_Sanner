package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAnalyticsOverviewResponse {
    private Integer totalTests;
    private Integer totalScannedBlanks;
    private Integer totalScoredBlanks;
    private Integer totalNeedsReview;
    private BigDecimal averageScore;
    private BigDecimal averagePercentage;
    private List<GradeDistributionItemResponse> overallGradeDistribution;
    private List<TestAnalyticsSummaryResponse> tests;
}
