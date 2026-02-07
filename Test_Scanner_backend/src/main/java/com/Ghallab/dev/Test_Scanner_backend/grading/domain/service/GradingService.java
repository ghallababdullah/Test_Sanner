package com.Ghallab.dev.Test_Scanner_backend.grading.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingRequest;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingResponse;

import java.util.List;
import java.util.UUID;

/**
 * GradingService - Interface for grading operations
 */
public interface GradingService {

    /**
     * Evaluate student answers and generate grading result
     */
    Response<GradingResponse> evaluateTest(GradingRequest request);

    /**
     * Get all grading results for a specific test
     */
    Response<List<GradingResponse>> getResultsByTest(UUID testId);

    /**
     * Get all grading results for a specific user
     */
    Response<List<GradingResponse>> getResultsByUser(UUID userId);

    /**
     * Get detailed answer information for a grading result
     */
    Response<GradingResponse> getGradingResultDetails(UUID gradingResultId);
}


