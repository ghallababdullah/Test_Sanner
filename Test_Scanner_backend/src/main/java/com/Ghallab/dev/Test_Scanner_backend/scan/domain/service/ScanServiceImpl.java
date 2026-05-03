package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.StudentAnswer;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.TestResult;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.StudentAnswerRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.TestResultRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.service.ScannedBlankResultService;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScanSession;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScannedBlankRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScanSessionRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankDetailedResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.StartScanSessionRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.UploadScannedBlankRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.mapper.ScanMapper;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.dto.StudentAnswerResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ScanService implementation
 * Handles raw OCR data extraction and storage
 * Does NOT perform grading - that's GradingService responsibility
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ScanServiceImpl implements ScanService {

    private final ScanSessionRepository scanSessionRepository;
    private final ScannedBlankRepository scannedBlankRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final ScanMapper scanMapper;
    private final ScanFileStorageService scanFileStorageService;
    private final ScanJobPublisher scanJobPublisher;
    private final ScannedBlankResultService scannedBlankResultService;
    private final TestResultRepository testResultRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final ObjectMapper objectMapper; // For JSON serialization

    /**
     * Start a new scanning session
     */
    @Override
    public Response<ScanSessionResponse> startScanSession(StartScanSessionRequest request) {
        try {
            log.info("Starting new scan session for test: {}", request.getTestId());

            // Get current user (teacher who is scanning)
            User currentUser = getCurrentUser();

            // Get test
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> new NotFoundException("Test not found"));

            // Convert metadata Object to JSON string
            String metadataJson = null;
            if (request.getMetadata() != null) {
                metadataJson = objectMapper.writeValueAsString(request.getMetadata());
            }

            // Create scan session
            ScanSession session = ScanSession.builder()
                    .test(test)
                    .user(currentUser)
                    .name(request.getName())
                    .description(request.getDescription())
                    .deviceId(request.getDeviceId())
                    .deviceModel(request.getDeviceModel())
                    .totalBlanks(0)
                    .startedAt(LocalDateTime.now())
                    .metadata(metadataJson)
                    .build();

            ScanSession savedSession = scanSessionRepository.save(session);
            log.info("Scan session created: {}", savedSession.getId());

            return Response.success(scanMapper.toScanSessionResponse(savedSession), "Scan session started successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error starting scan session", e);
            return Response.error("Failed to start scan session: " + e.getMessage(), 500);
        }
    }

    /**
     * Receive an uploaded scanned blank and create a pending OCR record.
     */
    @Override
    public Response<ScannedBlankResponse> submitScannedBlank(UploadScannedBlankRequest request) {
        try {
            MultipartFile image = request.getImage();
            if (image == null || image.isEmpty()) {
                return Response.error("Scanned image is required", 400);
            }

            log.info("Submitting scanned blank image for test: {}, file: {}",
                    request.getTestId(),
                    image.getOriginalFilename());

            // Get current user (teacher)
            User currentUser = getCurrentUser();

            // Get scan session
            ScanSession session = scanSessionRepository.findById(request.getScanSessionId())
                    .orElseThrow(() -> new NotFoundException("Scan session not found"));

            // Get test
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> new NotFoundException("Test not found"));

            String originalImagePath = scanFileStorageService.store(session.getId(), image);

            // Create scanned blank in pending OCR state.
            ScannedBlank blank = ScannedBlank.builder()
                    .scanSession(session)
                    .test(test)
                    .scannedBy(currentUser)
                    .testDate(request.getTestDate())
                    .originalImagePath(originalImagePath)
                    .answers(null)
                    .errorCorrections(null)
                    .isErrorCorrectionApplied(false)
                    .processingStatus(ScannedBlank.ProcessingStatus.PENDING_OCR)
                    .processingError(null)
                    .overallConfidence(null)
                    .needsReview(false)
                    .reviewStatus(ScannedBlank.ReviewStatus.PENDING)
                    .scannedAt(LocalDateTime.now())
                    .build();

            ScannedBlank savedBlank = scannedBlankRepository.save(blank);

            try {
                scanJobPublisher.publishScanRequested(savedBlank);
                savedBlank.setProcessingStatus(ScannedBlank.ProcessingStatus.QUEUED);
                savedBlank.setProcessingError(null);
                savedBlank = scannedBlankRepository.save(savedBlank);
            } catch (Exception publishException) {
                log.error("Failed to publish OCR job for blank: {}", savedBlank.getId(), publishException);
                savedBlank.setProcessingStatus(ScannedBlank.ProcessingStatus.OCR_FAILED);
                savedBlank.setProcessingError("Failed to publish OCR job: " + publishException.getMessage());
                savedBlank = scannedBlankRepository.save(savedBlank);
                return Response.error("Scanned blank saved, but failed to queue OCR job", 500);
            }

            // Update session total blanks count
            session.setTotalBlanks(session.getTotalBlanks() + 1);
            scanSessionRepository.save(session);

            log.info("Scanned blank saved: {}", savedBlank.getId());

            return Response.success(scanMapper.toScannedBlankResponse(savedBlank), "Scanned blank uploaded successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (IOException e) {
            log.error("Error storing scanned image", e);
            return Response.error("Failed to store scanned image: " + e.getMessage(), 500);
        } catch (Exception e) {
            log.error("Error submitting scanned blank", e);
            return Response.error("Failed to submit scanned blank: " + e.getMessage(), 500);
        }
    }

    /**
     * Get all scanned blanks for a specific test
     */
    @Override
    @Transactional(readOnly = true)
    public Response<List<ScannedBlankResponse>> getScannedBlanksByTest(UUID testId) {
        try {
            log.info("Fetching scanned blanks for test: {}", testId);

            // Verify test exists
            testRepository.findById(testId)
                    .orElseThrow(() -> new NotFoundException("Test not found"));

            List<ScannedBlank> blanks = scannedBlankRepository.findByTestId(testId);
            List<ScannedBlankResponse> responses = blanks.stream()
                    .map(scanMapper::toScannedBlankResponse)
                    .collect(Collectors.toList());

            return Response.success(responses, "Scanned blanks retrieved successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error fetching scanned blanks", e);
            return Response.error("Failed to fetch scanned blanks: " + e.getMessage(), 500);
        }
    }

    /**
     * Get all scanned blanks for a specific scanning session
     */
    @Override
    @Transactional(readOnly = true)
    public Response<List<ScannedBlankResponse>> getScannedBlanksBySession(UUID sessionId) {
        try {
            log.info("Fetching scanned blanks for session: {}", sessionId);

            // Verify session exists
            scanSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new NotFoundException("Scan session not found"));

            List<ScannedBlank> blanks = scannedBlankRepository.findByScanSessionId(sessionId);
            List<ScannedBlankResponse> responses = blanks.stream()
                    .map(scanMapper::toScannedBlankResponse)
                    .collect(Collectors.toList());

            return Response.success(responses, "Scanned blanks retrieved successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error fetching scanned blanks", e);
            return Response.error("Failed to fetch scanned blanks: " + e.getMessage(), 500);
        }
    }

    /**
     * Get a specific scanned blank
     */
    @Override
    @Transactional(readOnly = true)
    public Response<ScannedBlankResponse> getScannedBlankById(UUID blankId) {
        try {
            log.info("Fetching scanned blank: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            return Response.success(scanMapper.toScannedBlankResponse(blank), "Scanned blank retrieved successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error fetching scanned blank", e);
            return Response.error("Failed to fetch scanned blank: " + e.getMessage(), 500);
        }
    }

    /**
     * Mark scanned blank as needs review
     */
    @Override
    public Response<ScannedBlankResponse> markForReview(UUID blankId, String reviewNotes) {
        try {
            log.info("Marking scanned blank for review: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            blank.setNeedsReview(true);
            blank.setReviewNotes(reviewNotes);
            blank.setReviewStatus(ScannedBlank.ReviewStatus.PENDING);

            ScannedBlank updated = scannedBlankRepository.save(blank);

            return Response.success(scanMapper.toScannedBlankResponse(updated), "Scanned blank marked for review");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error marking blank for review", e);
            return Response.error("Failed to mark blank for review: " + e.getMessage(), 500);
        }
    }

    /**
     * Apply error corrections to a scanned blank
     * Takes errorCorrections from request body and applies them
     */
    @Override
    public Response<ScannedBlankResponse> applyErrorCorrections(UUID blankId, Object errorCorrections) {
        try {
            log.info("Applying error corrections to blank: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            // Check if errorCorrections are provided
            if (errorCorrections == null) {
                return Response.error("No error corrections to apply", 400);
            }

            @SuppressWarnings("unchecked")
            Map<String, String> rawCorrections = errorCorrections instanceof Map<?, ?> map
                    ? map.entrySet().stream().collect(Collectors.toMap(
                            entry -> String.valueOf(entry.getKey()),
                            entry -> entry.getValue() == null ? null : String.valueOf(entry.getValue()),
                            (left, right) -> right,
                            LinkedHashMap::new
                    ))
                    : new LinkedHashMap<>();

            Map<String, String> filteredCorrections = scannedBlankResultService.filterAnswersForTest(
                    blank.getTest().getId(),
                    rawCorrections
            );
            if (filteredCorrections.isEmpty()) {
                return Response.error("No valid error corrections matched this test's answer keys", 400);
            }

            // Serialize filtered errorCorrections Object to JSON string
            String errorCorrectionsJson = objectMapper.writeValueAsString(filteredCorrections);

            // Set the corrections on the blank
            blank.setErrorCorrections(errorCorrectionsJson);
            blank.setIsErrorCorrectionApplied(true);
            blank.setNeedsReview(false);
            blank.setReviewStatus(ScannedBlank.ReviewStatus.CORRECTED);
            blank.setReviewedAt(LocalDateTime.now());
            blank.setReviewedBy(getCurrentUser());

            ScannedBlank updated = scannedBlankRepository.save(blank);
            scannedBlankResultService.evaluateAndPersist(updated);

            return Response.success(scanMapper.toScannedBlankResponse(updated), "Error corrections applied successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error applying corrections", e);
            return Response.error("Failed to apply corrections: " + e.getMessage(), 500);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Response<ScannedBlankDetailedResponse> getScannedBlankDetails(UUID blankId) {
        try {
            log.info("Fetching detailed scanned blank view: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            TestResult testResult = testResultRepository.findByScannedBlankId(blankId).orElse(null);
            List<StudentAnswer> answerGrades = studentAnswerRepository.findByScannedBlankId(blankId);

            ScannedBlankDetailedResponse response = new ScannedBlankDetailedResponse();
            response.setId(blank.getId());
            response.setScanSessionId(blank.getScanSession() != null ? blank.getScanSession().getId() : null);
            response.setTestId(blank.getTest() != null ? blank.getTest().getId() : null);
            response.setStudentName(blank.getStudentName());
            response.setStudentClass(blank.getStudentClass());
            response.setTestDate(blank.getTestDate());
            response.setOverallConfidence(blank.getOverallConfidence());
            response.setNeedsReview(blank.getNeedsReview());
            response.setReviewStatus(blank.getReviewStatus() != null ? blank.getReviewStatus().name() : null);
            response.setAnswers(scannedBlankResultService.readStringMap(blank.getAnswers()));
            response.setErrorCorrections(scannedBlankResultService.readStringMap(blank.getErrorCorrections()));
            response.setFinalAnswers(scannedBlankResultService.buildFinalAnswers(blank));
            response.setIsErrorCorrectionApplied(blank.getIsErrorCorrectionApplied());
            response.setIsScored(testResult != null);
            response.setRawScore(testResult != null ? testResult.getTotalScore() : null);
            response.setMaxScore(testResult != null ? testResult.getMaxScore() : null);
            response.setPercentage(testResult != null ? testResult.getPercentage() : null);
            response.setGrade(testResult != null ? testResult.getGrade() : null);
            response.setFeedback(buildFeedback(testResult));
            response.setReviewNotes(blank.getReviewNotes());
            response.setAnswerGrades(answerGrades.stream()
                    .map(this::toStudentAnswerResponse)
                    .collect(Collectors.toList()));
            response.setOriginalImagePath(blank.getOriginalImagePath());
            response.setProcessedImagePath(blank.getProcessedImagePath());
            response.setThumbnailPath(blank.getThumbnailPath());
            response.setProcessingStatus(blank.getProcessingStatus() != null ? blank.getProcessingStatus().name() : null);
            response.setProcessingError(blank.getProcessingError());
            response.setScannedAt(blank.getScannedAt());
            response.setProcessedAt(blank.getProcessedAt());
            response.setScoredAt(testResult != null ? testResult.getCreatedAt() : null);
            response.setReviewedAt(blank.getReviewedAt());
            response.setCreatedAt(blank.getCreatedAt());

            return Response.success(response, "Scanned blank details retrieved successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error fetching scanned blank details", e);
            return Response.error("Failed to fetch scanned blank details: " + e.getMessage(), 500);
        }
    }

    @Override
    public Response<ScannedBlankResponse> retryOcr(UUID blankId) {
        try {
            log.info("Retrying OCR for blank: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            scanJobPublisher.publishScanRequested(blank);
            blank.setProcessingStatus(ScannedBlank.ProcessingStatus.QUEUED);
            blank.setProcessingError(null);
            blank.setProcessedAt(null);

            ScannedBlank updated = scannedBlankRepository.save(blank);
            return Response.success(scanMapper.toScannedBlankResponse(updated), "OCR job re-queued successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error retrying OCR for blank: {}", blankId, e);
            return Response.error("Failed to retry OCR: " + e.getMessage(), 500);
        }
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NotFoundException("User is not authenticated");
        }
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private String buildFeedback(TestResult testResult) {
        if (testResult == null) {
            return null;
        }
        BigDecimal total = testResult.getTotalScore();
        BigDecimal max = testResult.getMaxScore();
        BigDecimal percentage = testResult.getPercentage();
        String grade = testResult.getGrade();
        return "Score: " + total + "/" + max + " (" + percentage + "%) - Grade: " + grade;
    }

    private StudentAnswerResponse toStudentAnswerResponse(StudentAnswer answer) {
        StudentAnswerResponse response = new StudentAnswerResponse();
        response.setId(answer.getId());
        response.setScannedBlankId(answer.getScannedBlank() != null ? answer.getScannedBlank().getId() : null);
        response.setQuestionNumber(answer.getQuestionNumber());
        response.setCorrectAnswer(answer.getCorrectAnswer());
        response.setStudentAnswer(answer.getStudentAnswer());
        response.setFinalAnswer(answer.getFinalAnswer());
        response.setScore(answer.getScore());
        response.setMaxPoints(answer.getMaxPoints());
        response.setMatchType(answer.getMatchType());
        response.setCreatedAt(answer.getCreatedAt());
        return response;
    }
}

