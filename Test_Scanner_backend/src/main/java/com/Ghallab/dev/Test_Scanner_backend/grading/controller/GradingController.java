package com.Ghallab.dev.Test_Scanner_backend.grading.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.service.GradingService;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingRequest;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * GradingController - REST API endpoints for grading operations
 *
 * Endpoints:
 * - POST /api/grading/evaluate - Evaluate test answers
 * - GET /api/grading/results/{testId} - Get results for a test
 * - GET /api/grading/results/user/{userId} - Get user results
 * - GET /api/grading/results/{gradingResultId}/details - Get result details
 */
@RestController
@RequestMapping("/api/grading")
@Slf4j
@AllArgsConstructor
public class GradingController {

    private final GradingService gradingService;

    /**
     * POST /api/grading/evaluate
     * Evaluate student answers and generate grading result
     *
     * @param request - GradingRequest with testId, userId, and answers
     * @return GradingResponse with scoring details
     */
    @PostMapping("/evaluate")
    public ResponseEntity<Response<GradingResponse>> evaluateTest(
            @Valid @RequestBody GradingRequest request,
            Authentication authentication) {

        log.info("📊 POST /api/grading/evaluate - Evaluating test for user: {}", request.getUserId());

        Response<GradingResponse> response = gradingService.evaluateTest(request);

        log.info("✅ Test evaluation completed successfully");
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * GET /api/grading/results/{testId}
     * Get all grading results for a specific test
     *
     * @param testId - Test ID
     * @return List of GradingResponse for the test
     */
    @GetMapping("/results/{testId}")
    public ResponseEntity<Response<List<GradingResponse>>> getResultsByTest(
            @PathVariable UUID testId,
            Authentication authentication) {

        log.info("🔍 GET /api/grading/results/{} - Retrieving results for test", testId);

        Response<List<GradingResponse>> response = gradingService.getResultsByTest(testId);

        log.info("✅ Results retrieved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/grading/results/user/{userId}
     * Get all grading results for a specific user
     *
     * @param userId - User ID
     * @return List of GradingResponse for the user
     */
    @GetMapping("/results/user/{userId}")
    public ResponseEntity<Response<List<GradingResponse>>> getResultsByUser(
            @PathVariable UUID userId,
            Authentication authentication) {

        log.info("🔍 GET /api/grading/results/user/{} - Retrieving results for user", userId);

        Response<List<GradingResponse>> response = gradingService.getResultsByUser(userId);

        log.info("✅ User results retrieved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/grading/results/{gradingResultId}/details
     * Get detailed information about a grading result including all answer details
     *
     * @param gradingResultId - Grading Result ID
     * @return GradingResponse with detailed answer information
     */
    @GetMapping("/results/{gradingResultId}/details")
    public ResponseEntity<Response<GradingResponse>> getGradingResultDetails(
            @PathVariable UUID gradingResultId,
            Authentication authentication) {

        log.info("🔍 GET /api/grading/results/{}/details - Retrieving result details", gradingResultId);

        Response<GradingResponse> response = gradingService.getGradingResultDetails(gradingResultId);

        log.info("✅ Result details retrieved successfully");
        return ResponseEntity.ok(response);
    }
}

