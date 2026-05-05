package com.Ghallab.dev.Test_Scanner_backend.analytics.controller;

import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestAnalyticsSummaryResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestQuestionBreakdownResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.UserAnalyticsOverviewResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.service.AnalyticsService;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/tests/{testId}/summary")
    public ResponseEntity<Response<TestAnalyticsSummaryResponse>> getTestSummary(
            @PathVariable UUID testId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching analytics summary for test {} user {}", testId, userEmail);
        return ResponseEntity.ok(Response.success(
                analyticsService.getTestSummary(testId, userEmail),
                "Test analytics summary retrieved successfully"
        ));
    }

    @GetMapping("/tests/{testId}/questions")
    public ResponseEntity<Response<TestQuestionBreakdownResponse>> getQuestionBreakdown(
            @PathVariable UUID testId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching question analytics for test {} user {}", testId, userEmail);
        return ResponseEntity.ok(Response.success(
                analyticsService.getQuestionBreakdown(testId, userEmail),
                "Question analytics retrieved successfully"
        ));
    }

    @GetMapping("/tests/my/summaries")
    public ResponseEntity<Response<List<TestAnalyticsSummaryResponse>>> getCurrentUserTestSummaries(
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching analytics summaries for user {}", userEmail);
        return ResponseEntity.ok(Response.success(
                analyticsService.getCurrentUserTestSummaries(userEmail),
                "Analytics summaries retrieved successfully"
        ));
    }

    @GetMapping("/tests/my/overview")
    public ResponseEntity<Response<UserAnalyticsOverviewResponse>> getCurrentUserOverview(
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching analytics overview for user {}", userEmail);
        return ResponseEntity.ok(Response.success(
                analyticsService.getCurrentUserOverview(userEmail),
                "Analytics overview retrieved successfully"
        ));
    }
}
