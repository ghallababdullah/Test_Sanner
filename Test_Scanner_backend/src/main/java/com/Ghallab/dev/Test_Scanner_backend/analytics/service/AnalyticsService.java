package com.Ghallab.dev.Test_Scanner_backend.analytics.service;

import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestAnalyticsSummaryResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestQuestionBreakdownResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.UserAnalyticsOverviewResponse;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    TestAnalyticsSummaryResponse getTestSummary(UUID testId, String userEmail);

    TestQuestionBreakdownResponse getQuestionBreakdown(UUID testId, String userEmail);

    List<TestAnalyticsSummaryResponse> getCurrentUserTestSummaries(String userEmail);

    UserAnalyticsOverviewResponse getCurrentUserOverview(String userEmail);
}
