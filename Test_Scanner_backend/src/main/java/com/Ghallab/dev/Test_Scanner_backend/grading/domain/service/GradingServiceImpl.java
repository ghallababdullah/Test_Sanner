package com.Ghallab.dev.Test_Scanner_backend.grading.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingAnswerDetail;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingResult;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.repository.GradingAnswerDetailRepository;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.repository.GradingResultRepository;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingRequest;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingResponse;
import com.Ghallab.dev.Test_Scanner_backend.grading.mapper.GradingMapper;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.AnswerKeyRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.GradeThresholdRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * GradingServiceImpl - Implementation of grading logic
 * Handles scoring, grading, and result storage
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GradingServiceImpl implements GradingService {

    private final TestRepository testRepository;
    private final AnswerKeyRepository answerKeyRepository;
    private final GradeThresholdRepository gradeThresholdRepository;
    private final GradingResultRepository gradingResultRepository;
    private final GradingAnswerDetailRepository gradingAnswerDetailRepository;
    private final UserRepository userRepository;
    private final GradingMapper gradingMapper;

    @Override
    @Transactional
    public Response<GradingResponse> evaluateTest(GradingRequest request) {
        log.info("🎯 Starting test evaluation for test: {} and user: {}", request.getTestId(), request.getUserId());

        try {
            // ✅ Fetch Test
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> {
                        log.error("❌ Test not found: {}", request.getTestId());
                        return new NotFoundException("Test not found with id: " + request.getTestId());
                    });
            log.debug("✅ Test found: {}", test.getTitle());

            // ✅ Fetch User
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> {
                        log.error("❌ User not found: {}", request.getUserId());
                        return new NotFoundException("User not found with id: " + request.getUserId());
                    });
            log.debug("✅ User found: {}", user.getEmail());

            // ✅ Fetch AnswerKeys and GradeThresholds
            List<AnswerKey> answerKeys = answerKeyRepository.findByTestId(request.getTestId());
            List<GradeThreshold> gradeThresholds = gradeThresholdRepository.findByTestId(request.getTestId());
            log.debug("✅ Found {} answer keys and {} grade thresholds", answerKeys.size(), gradeThresholds.size());

            // ✅ Calculate score and create GradingResult
            BigDecimal rawScore = BigDecimal.ZERO;
            BigDecimal maxScore = BigDecimal.ZERO;
            List<GradingAnswerDetail> answerDetails = new ArrayList<>();

            // Calculate each answer
            for (GradingRequest.StudentAnswerInput studentAnswer : request.getAnswers()) {
                AnswerKey answerKey = answerKeys.stream()
                        .filter(ak -> ak.getQuestionNumber().equals(studentAnswer.getQuestionNumber()))
                        .findFirst()
                        .orElse(null);

                if (answerKey != null) {
                    // Calculate score for this answer
                    BigDecimal pointsEarned = calculateScore(
                            studentAnswer.getAnswer(),
                            answerKey.getCorrectAnswer(),
                            answerKey.getMaxPoints(),
                            answerKey.getToleranceLevel()
                    );

                    rawScore = rawScore.add(pointsEarned);
                    maxScore = maxScore.add(answerKey.getMaxPoints());

                    // Get Levenshtein distance for details
                    int distance = levenshteinDistance(
                            studentAnswer.getAnswer().toUpperCase().trim(),
                            answerKey.getCorrectAnswer().toUpperCase().trim()
                    );

                    // Determine match type
                    String matchType = determineMatchType(distance, answerKey.getToleranceLevel());

                    // Create answer detail (will be saved after GradingResult is created)
                    GradingAnswerDetail detail = GradingAnswerDetail.builder()
                            .questionNumber(studentAnswer.getQuestionNumber())
                            .studentAnswer(studentAnswer.getAnswer())
                            .correctAnswer(answerKey.getCorrectAnswer())
                            .pointsEarned(pointsEarned)
                            .maxPoints(answerKey.getMaxPoints())
                            .distance(distance)
                            .isCorrect(pointsEarned.equals(answerKey.getMaxPoints()))
                            .matchType(matchType)
                            .build();

                    answerDetails.add(detail);
                }
            }

            // ✅ Calculate percentage
            BigDecimal percentage = calculatePercentage(rawScore, maxScore);
            log.debug("✅ Raw score: {}/{}, Percentage: {}%", rawScore, maxScore, percentage);

            // ✅ Calculate grade
            String grade = calculateGrade(percentage, gradeThresholds);
            log.debug("✅ Grade assigned: {}", grade);

            // ✅ VALIDATE CLASS LEVEL (Test class vs Student class)
            // This is a warning check - we log it but don't fail
            String testClassLevel = test.getClassLevel();
            String studentClassFromBlank = request.getStudentClass();

            if (testClassLevel != null && studentClassFromBlank != null) {
                if (!testClassLevel.equalsIgnoreCase(studentClassFromBlank)) {
                    log.warn("⚠️ CLASS MISMATCH DETECTED!");
                    log.warn("   Test is intended for class: {}", testClassLevel);
                    log.warn("   But student from blank is: {}", studentClassFromBlank);
                    log.warn("   This might indicate a scanning error or student from different class");
                } else {
                    log.debug("✅ Class levels match: {} == {}", testClassLevel, studentClassFromBlank);
                }
            } else if (testClassLevel != null) {
                log.warn("⚠️ Test is for class {}, but no student class was provided in request", testClassLevel);
            } else if (studentClassFromBlank != null) {
                log.debug("ℹ️ Student class provided ({}) but test has no class level defined", studentClassFromBlank);
            }

            // ✅ Create and save GradingResult
            GradingResult gradingResult = GradingResult.builder()
                    .test(test)
                    .user(user)
                    .studentName(request.getStudentName())
                    .studentLastName(request.getStudentLastName())
                    .studentClass(request.getStudentClass())
                    .rawScore(rawScore)
                    .maxScore(maxScore)
                    .percentage(percentage)
                    .grade(grade)
                    .build();

            GradingResult savedResult = gradingResultRepository.save(gradingResult);
            log.info("✅ Grading result saved: {}", savedResult.getId());

            // ✅ Save answer details
            List<GradingAnswerDetail> savedAnswerDetails = new java.util.ArrayList<>();
            for (GradingAnswerDetail detail : answerDetails) {
                detail.setGradingResult(savedResult);
                GradingAnswerDetail savedDetail = gradingAnswerDetailRepository.save(detail);
                savedAnswerDetails.add(savedDetail);
            }
            log.debug("✅ Saved {} answer details", savedAnswerDetails.size());

            // ✅ Set answer details in savedResult (since Hibernate lazy load won't work after response)
            savedResult.setAnswerDetails(savedAnswerDetails);

            // ✅ Set feedback
            String feedback = "Score: " + rawScore + "/" + maxScore + " (" + percentage + "%) - Grade: " + grade;
            savedResult.setFeedback(feedback);

            // ✅ Build response
            GradingResponse response = gradingMapper.toGradingResponse(savedResult);

            log.info("✅ Test evaluation completed successfully");
            return Response.<GradingResponse>builder()
                    .success(true)
                    .message("Test evaluated successfully")
                    .data(response)
                    .statusCode(HttpStatus.CREATED.value())
                    .build();

        } catch (NotFoundException e) {
            log.error("❌ Not found error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error evaluating test: {}", e.getMessage(), e);
            throw new RuntimeException("Error evaluating test: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Response<List<GradingResponse>> getResultsByTest(UUID testId) {
        log.info("🔍 Retrieving grading results for test: {}", testId);

        List<GradingResult> results = gradingResultRepository.findByTestId(testId);
        List<GradingResponse> responses = gradingMapper.toGradingResponseList(results);

        log.info("✅ Found {} grading results for test", results.size());
        return Response.<List<GradingResponse>>builder()
                .success(true)
                .message("Grading results retrieved successfully")
                .data(responses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Response<List<GradingResponse>> getResultsByUser(UUID userId) {
        log.info("🔍 Retrieving grading results for user: {}", userId);

        List<GradingResult> results = gradingResultRepository.findByUserId(userId);
        List<GradingResponse> responses = gradingMapper.toGradingResponseList(results);

        log.info("✅ Found {} grading results for user", results.size());
        return Response.<List<GradingResponse>>builder()
                .success(true)
                .message("User grading results retrieved successfully")
                .data(responses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Response<GradingResponse> getGradingResultDetails(UUID gradingResultId) {
        log.info("🔍 Retrieving grading result details: {}", gradingResultId);

        GradingResult result = gradingResultRepository.findById(gradingResultId)
                .orElseThrow(() -> {
                    log.error("❌ Grading result not found: {}", gradingResultId);
                    return new NotFoundException("Grading result not found with id: " + gradingResultId);
                });

        GradingResponse response = gradingMapper.toGradingResponse(result);

        log.info("✅ Grading result details retrieved");
        return Response.<GradingResponse>builder()
                .success(true)
                .message("Grading result details retrieved successfully")
                .data(response)
                .build();
    }


    /**
     * Calculate score for a single answer based on Levenshtein distance
     *
     * Formula:
     * - distance == 0: max_points (perfect match)
     * - distance <= tolerance_level: max_points - distance
     * - distance > tolerance_level: 0 (too many differences)
     */
    private BigDecimal calculateScore(String studentAnswer, String correctAnswer, BigDecimal maxPoints, Integer toleranceLevel) {
        String student = studentAnswer.toUpperCase().trim();
        String correct = correctAnswer.toUpperCase().trim();

        int distance = levenshteinDistance(student, correct);
        log.debug("🔍 Comparing '{}' vs '{}': distance = {}", student, correct, distance);

        if (distance == 0) {
            log.debug("✅ Perfect match!");
            return maxPoints;
        } else if (distance <= toleranceLevel) {
            BigDecimal deduction = BigDecimal.valueOf(distance);
            BigDecimal earned = maxPoints.subtract(deduction);
            log.debug("✅ Within tolerance: earned = {} - {} = {}", maxPoints, distance, earned);
            return earned;
        } else {
            log.debug("❌ Exceeds tolerance level");
            return BigDecimal.ZERO;
        }
    }

    /**
     * Calculate percentage: (rawScore / maxScore) * 100
     */
    private BigDecimal calculatePercentage(BigDecimal rawScore, BigDecimal maxScore) {
        if (maxScore.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return rawScore.divide(maxScore, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Determine grade based on percentage and grade thresholds
     *
     * Default thresholds:
     * - 91-100%: 5 (отлично)
     * - 71-90%: 4 (хорошо)
     * - 51-70%: 3 (удовлетворительно)
     * - 0-50%: 2 (неудовлетворительно)
     */
    private String calculateGrade(BigDecimal percentage, List<GradeThreshold> gradeThresholds) {
        for (GradeThreshold threshold : gradeThresholds) {
            int minPct = threshold.getMinPercentage();
            int maxPct = threshold.getMaxPercentage();
            int pct = percentage.intValue();

            if (pct >= minPct && pct <= maxPct) {
                log.debug("✅ Grade assigned: {} ({}% is between {}% and {}%)",
                    threshold.getGradeSymbol(), pct, minPct, maxPct);
                return threshold.getGradeSymbol();
            }
        }

        // Default fallback
        log.warn("⚠️ No matching grade threshold found, assigning default grade 2");
        return "2";
    }

    /**
     * Determine match type based on Levenshtein distance and tolerance level
     */
    private String determineMatchType(int distance, Integer toleranceLevel) {
        if (distance == 0) {
            return "EXACT";
        } else if (distance == 1) {
            return "TOLERANCE_1";
        } else if (distance == 2 && toleranceLevel >= 2) {
            return "TOLERANCE_2";
        } else {
            return "NO_MATCH";
        }
    }

    /**
     * Calculate Levenshtein Distance between two strings
     *
     * The Levenshtein distance is the minimum number of single-character edits
     * (insertions, deletions or substitutions) required to change one word into another.
     *
     * Example:
     * - "ABC" vs "ABC" = 0 (identical)
     * - "ABC" vs "ABD" = 1 (1 substitution: C→D)
     * - "ABC" vs "ABCD" = 1 (1 insertion: D)
     * - "ABC" vs "BC" = 1 (1 deletion: A)
     */
    private int levenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();

        // Create distance matrix
        int[][] dp = new int[len1 + 1][len2 + 1];

        // Initialize first row and column
        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        // Calculate distances
        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;

                dp[i][j] = Math.min(Math.min(
                        dp[i - 1][j] + 1,      // deletion
                        dp[i][j - 1] + 1),    // insertion
                        dp[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return dp[len1][len2];
    }
}

