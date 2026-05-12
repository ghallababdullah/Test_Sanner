package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
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
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.RoiMetaResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.RoiBoxResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.OcrAnswerAssessmentResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.mapper.ScanMapper;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.dto.StudentAnswerResponse;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.nio.file.Path;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.HashMap;
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
    private static final int SCAN_SESSION_NAME_MAX_LENGTH = 200;
    private static final int SCAN_SESSION_DEVICE_FIELD_MAX_LENGTH = 100;

    private final ScanSessionRepository scanSessionRepository;
    private final ScannedBlankRepository scannedBlankRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final ScanMapper scanMapper;
    private final ScanFileStorageService scanFileStorageService;
    private final ScanImageValidationService scanImageValidationService;
    private final ScanJobPublisher scanJobPublisher;
    private final ScanPreviewService scanPreviewService;
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
                    .name(clampText(request.getName(), SCAN_SESSION_NAME_MAX_LENGTH))
                    .description(request.getDescription())
                    .deviceId(clampText(request.getDeviceId(), SCAN_SESSION_DEVICE_FIELD_MAX_LENGTH))
                    .deviceModel(clampText(request.getDeviceModel(), SCAN_SESSION_DEVICE_FIELD_MAX_LENGTH))
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
            scanImageValidationService.validate(image);

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

            ScannedBlank savedBlank = createPendingBlank(session, test, currentUser, request);

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
        } catch (BadRequestException e) {
            log.warn("Validation error while submitting scanned blank: {}", e.getMessage());
            return Response.error(e.getMessage(), 400);
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

    @Override
    public Response<ScannedBlankResponse> submitScannedBlankForPreview(UploadScannedBlankRequest request) {
        try {
            MultipartFile image = request.getImage();
            if (image == null || image.isEmpty()) {
                return Response.error("Scanned image is required", 400);
            }
            scanImageValidationService.validate(image);

            log.info("Submitting scanned blank image for ROI preview only, test: {}, file: {}",
                    request.getTestId(),
                    image.getOriginalFilename());

            User currentUser = getCurrentUser();
            ScanSession session = scanSessionRepository.findById(request.getScanSessionId())
                    .orElseThrow(() -> new NotFoundException("Scan session not found"));
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> new NotFoundException("Test not found"));

            ScannedBlank savedBlank = createPendingBlank(session, test, currentUser, request);

            try {
                String copiedProcessedPath = scanPreviewService.generatePreviewAndCopyArtifacts(savedBlank.getOriginalImagePath(), scanFileStorageService);
                savedBlank.setProcessedImagePath(copiedProcessedPath);
                savedBlank.setProcessingStatus(ScannedBlank.ProcessingStatus.PENDING_OCR);
                savedBlank.setProcessingError(null);
                savedBlank = scannedBlankRepository.save(savedBlank);
            } catch (Exception previewException) {
                log.error("Failed to generate ROI preview for blank: {}", savedBlank.getId(), previewException);
                savedBlank.setProcessingStatus(ScannedBlank.ProcessingStatus.OCR_FAILED);
                savedBlank.setProcessingError("Failed to prepare ROI preview: " + previewException.getMessage());
                savedBlank = scannedBlankRepository.save(savedBlank);
                return Response.error("Blank saved, but ROI preview generation failed", 500);
            }

            session.setTotalBlanks(session.getTotalBlanks() + 1);
            scanSessionRepository.save(session);

            return Response.success(scanMapper.toScannedBlankResponse(savedBlank), "Scanned blank uploaded for ROI preview successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (BadRequestException e) {
            log.warn("Validation error while submitting preview blank: {}", e.getMessage());
            return Response.error(e.getMessage(), 400);
        } catch (IOException e) {
            log.error("Error storing scanned image", e);
            return Response.error("Failed to store scanned image: " + e.getMessage(), 500);
        } catch (Exception e) {
            log.error("Error submitting scanned blank for ROI preview", e);
            return Response.error("Failed to submit scanned blank for ROI preview: " + e.getMessage(), 500);
        }
    }

    @Override
    public Response<String> deleteScannedBlank(UUID blankId) {
        try {
            log.info("Deleting scanned blank: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            UUID sessionId = blank.getScanSession() != null ? blank.getScanSession().getId() : null;
            String originalImagePath = blank.getOriginalImagePath();
            String processedImagePath = blank.getProcessedImagePath();
            String thumbnailPath = blank.getThumbnailPath();

            studentAnswerRepository.deleteByScannedBlankId(blankId);
            testResultRepository.deleteByScannedBlankId(blankId);
            scannedBlankRepository.delete(blank);

            if (sessionId != null) {
                scanSessionRepository.findById(sessionId).ifPresent(session -> {
                    int updatedCount = Math.max(0, (session.getTotalBlanks() == null ? 0 : session.getTotalBlanks()) - 1);
                    session.setTotalBlanks(updatedCount);
                    scanSessionRepository.save(session);
                });
            }

            try {
                scanFileStorageService.deleteBlankArtifacts(originalImagePath, processedImagePath, thumbnailPath);
            } catch (IOException storageException) {
                log.warn("Failed to delete stored files for blank {}", blankId, storageException);
            }

            return Response.success("Scanned blank deleted successfully", "Scanned blank deleted successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error deleting scanned blank", e);
            return Response.error("Failed to delete scanned blank: " + e.getMessage(), 500);
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
            response.setAnswerAssessments(buildAnswerAssessments(blank));
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

    @Override
    public Response<ScannedBlankResponse> refreshPreview(UUID blankId) {
        try {
            log.info("Refreshing ROI preview for blank: {}", blankId);

            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            String copiedProcessedPath = scanPreviewService.generatePreviewAndCopyArtifacts(
                    blank.getOriginalImagePath(),
                    scanFileStorageService
            );

            blank.setProcessedImagePath(copiedProcessedPath);
            blank.setProcessingStatus(ScannedBlank.ProcessingStatus.PENDING_OCR);
            blank.setProcessingError(null);
            blank.setProcessedAt(null);

            ScannedBlank updated = scannedBlankRepository.save(blank);
            return Response.success(scanMapper.toScannedBlankResponse(updated), "ROI preview refreshed successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error refreshing ROI preview for blank: {}", blankId, e);
            return Response.error("Failed to refresh ROI preview: " + e.getMessage(), 500);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Path resolveBlankAssetPath(UUID blankId, String kind) {
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
                .orElseThrow(() -> new NotFoundException("Scanned blank not found"));
        return scanFileStorageService.resolveBlankAssetPath(blank, kind);
    }

    @Override
    @Transactional(readOnly = true)
    public Response<List<RoiMetaResponse>> getBlankRoiMetadata(UUID blankId) {
        try {
            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            List<RoiMetaResponse> items = scanFileStorageService.listBlankMetaFiles(blank).stream()
                    .map(this::readRoiMetaFile)
                    .toList();

            return Response.success(items, "ROI metadata retrieved successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error reading ROI metadata for blank: {}", blankId, e);
            return Response.error("Failed to read ROI metadata: " + e.getMessage(), 500);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Response<Map<String, RoiBoxResponse>> getBlankRoiOverrides(UUID blankId) {
        try {
            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            String rawJson = scanFileStorageService.readRoiOverrides(blank);
            if (rawJson == null || rawJson.isBlank()) {
                return Response.success(new LinkedHashMap<>(), "ROI overrides retrieved successfully");
            }

            @SuppressWarnings("unchecked")
            Map<String, RoiBoxResponse> overrides = objectMapper.readValue(
                    rawJson,
                    objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, RoiBoxResponse.class)
            );

            return Response.success(overrides, "ROI overrides retrieved successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error reading ROI overrides for blank: {}", blankId, e);
            return Response.error("Failed to read ROI overrides: " + e.getMessage(), 500);
        }
    }

    @Override
    public Response<Map<String, RoiBoxResponse>> saveBlankRoiOverrides(UUID blankId, Map<String, RoiBoxResponse> overrides) {
        try {
            ScannedBlank blank = scannedBlankRepository.findById(blankId)
                    .orElseThrow(() -> new NotFoundException("Scanned blank not found"));

            Map<String, RoiBoxResponse> normalized = normalizeRoiOverrides(overrides);
            String rawJson = objectMapper.writeValueAsString(normalized);
            scanFileStorageService.writeRoiOverrides(blank, rawJson);

            return Response.success(normalized, "ROI overrides saved successfully");
        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error saving ROI overrides for blank: {}", blankId, e);
            return Response.error("Failed to save ROI overrides: " + e.getMessage(), 500);
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

    private ScannedBlank createPendingBlank(ScanSession session, Test test, User currentUser, UploadScannedBlankRequest request) throws IOException {
        String originalImagePath = scanFileStorageService.store(session.getId(), request.getImage());

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
        log.info("Scanned blank saved: {}", savedBlank.getId());
        return savedBlank;
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

    private Map<String, OcrAnswerAssessmentResponse> buildAnswerAssessments(ScannedBlank blank) {
        Map<String, OcrAnswerAssessmentResponse> assessments = new LinkedHashMap<>();
        try {
            String ocrResultJson = scanFileStorageService.readOcrResultJson(blank);
            if (ocrResultJson == null || ocrResultJson.isBlank()) {
                return assessments;
            }

            JsonNode root = objectMapper.readTree(ocrResultJson);
            JsonNode fieldsNode = root.path("fields");
            if (!fieldsNode.isObject()) {
                return assessments;
            }

            for (int questionNumber = 1; questionNumber <= 32; questionNumber++) {
                String questionKey = String.valueOf(questionNumber);
                JsonNode fieldNode = fieldsNode.path("q" + questionNumber);
                if (fieldNode.isMissingNode() || fieldNode.isNull()) {
                    continue;
                }

                Double recognizedConfidence = readDouble(fieldNode.get("confidence"));
                JsonNode metadataNode = fieldNode.path("metadata");
                Double tesseractConfidence = readDouble(metadataNode.get("tesseractConfidence"));
                Double trocrConfidence = readDouble(metadataNode.get("trocrConfidence"));
                Double combinedConfidence = combineConfidences(recognizedConfidence, tesseractConfidence, trocrConfidence);
                boolean reviewRecommended = metadataNode.path("manualReviewRequired").asBoolean(false)
                        || (combinedConfidence != null && combinedConfidence < 0.75d);

                assessments.put(questionKey, new OcrAnswerAssessmentResponse(
                        questionNumber,
                        recognizedConfidence,
                        tesseractConfidence,
                        trocrConfidence,
                        combinedConfidence,
                        fieldNode.path("engine").asText(null),
                        fieldNode.path("status").asText(null),
                        reviewRecommended
                ));
            }
        } catch (Exception e) {
            log.warn("Failed to build OCR answer assessments for blank {}", blank != null ? blank.getId() : null, e);
        }
        return assessments;
    }

    private Double combineConfidences(Double recognizedConfidence, Double tesseractConfidence, Double trocrConfidence) {
        List<Double> values = new ArrayList<>();
        if (recognizedConfidence != null) {
            values.add(recognizedConfidence);
        }
        if (tesseractConfidence != null) {
            values.add(tesseractConfidence);
        }
        if (trocrConfidence != null) {
            values.add(trocrConfidence);
        }
        if (values.isEmpty()) {
            return null;
        }
        double sum = 0.0d;
        for (Double value : values) {
            sum += value;
        }
        return sum / values.size();
    }

    private Double readDouble(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.doubleValue();
        }
        if (node.isTextual()) {
            try {
                return Double.parseDouble(node.asText());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String clampText(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    @SuppressWarnings("unchecked")
    private RoiMetaResponse readRoiMetaFile(Path path) {
        try {
            Map<String, Object> raw = objectMapper.readValue(Files.readString(path), HashMap.class);
            return new RoiMetaResponse(
                    raw.get("roi_name") != null ? String.valueOf(raw.get("roi_name")) : stripMetaSuffix(path.getFileName().toString()),
                    raw.get("is_empty") instanceof Boolean value ? value : null,
                    raw.get("ink_ratio") instanceof Number value ? value.doubleValue() : null,
                    raw.get("num_components") instanceof Number value ? value.intValue() : null,
                    raw.get("meaningful_components") instanceof Number value ? value.intValue() : null,
                    raw.get("total_area") instanceof Number value ? value.intValue() : null,
                    raw.get("max_area") instanceof Number value ? value.intValue() : null,
                    path.getFileName().toString()
            );
        } catch (Exception exception) {
            log.warn("Failed to parse ROI meta file: {}", path, exception);
            return new RoiMetaResponse(
                    stripMetaSuffix(path.getFileName().toString()),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    path.getFileName().toString()
            );
        }
    }

    private String stripMetaSuffix(String filename) {
        return filename.endsWith(".meta.json") ? filename.substring(0, filename.length() - ".meta.json".length()) : filename;
    }

    private Map<String, RoiBoxResponse> normalizeRoiOverrides(Map<String, RoiBoxResponse> overrides) {
        Map<String, RoiBoxResponse> normalized = new LinkedHashMap<>();
        if (overrides == null) {
            return normalized;
        }

        overrides.forEach((roiName, box) -> {
            if (roiName == null || roiName.isBlank() || box == null) {
                return;
            }

            Integer x1 = box.getX1();
            Integer y1 = box.getY1();
            Integer x2 = box.getX2();
            Integer y2 = box.getY2();
            if (x1 == null || y1 == null || x2 == null || y2 == null) {
                return;
            }

            int nx1 = Math.max(0, Math.min(x1, x2));
            int ny1 = Math.max(0, Math.min(y1, y2));
            int nx2 = Math.max(nx1 + 1, Math.max(x1, x2));
            int ny2 = Math.max(ny1 + 1, Math.max(y1, y2));

            normalized.put(roiName, new RoiBoxResponse(nx1, ny1, nx2, ny2));
        });

        return normalized;
    }
}

