package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScanSession;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScannedBlankRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScanSessionRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.StartScanSessionRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.UploadScannedBlankRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.mapper.ScanMapper;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
     * Submit a scanned blank with extracted OCR data
     */
    @Override
    public Response<ScannedBlankResponse> submitScannedBlank(UploadScannedBlankRequest request) {
        try {
            log.info("Submitting scanned blank for test: {}, student: {}", request.getTestId(), request.getStudentName());

            // Get current user (teacher)
            User currentUser = getCurrentUser();

            // Get scan session
            ScanSession session = scanSessionRepository.findById(request.getScanSessionId())
                    .orElseThrow(() -> new NotFoundException("Scan session not found"));

            // Get test
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> new NotFoundException("Test not found"));

            // Serialize answers Object to JSON string
            String answersJson = null;
            if (request.getAnswers() != null) {
                answersJson = objectMapper.writeValueAsString(request.getAnswers());
            }

            // Serialize errorCorrections Object to JSON string
            String errorCorrectionsJson = null;
            if (request.getErrorCorrections() != null) {
                errorCorrectionsJson = objectMapper.writeValueAsString(request.getErrorCorrections());
            }

            // Create scanned blank
            ScannedBlank blank = ScannedBlank.builder()
                    .scanSession(session)
                    .test(test)
                    .scannedBy(currentUser)
                    .studentName(request.getStudentName())
                    .studentClass(request.getStudentClass())
                    .testDate(request.getTestDate())
                    .answers(answersJson)
                    .errorCorrections(errorCorrectionsJson)
                    .isErrorCorrectionApplied(request.getIsErrorCorrectionApplied() != null ? request.getIsErrorCorrectionApplied() : false)
                    .overallConfidence(request.getOverallConfidence())
                    .needsReview(false)
                    .reviewStatus(ScannedBlank.ReviewStatus.PENDING)
                    .scannedAt(LocalDateTime.now())
                    .build();

            ScannedBlank savedBlank = scannedBlankRepository.save(blank);

            // Update session total blanks count
            session.setTotalBlanks(session.getTotalBlanks() + 1);
            scanSessionRepository.save(session);

            log.info("Scanned blank saved: {}", savedBlank.getId());

            return Response.success(scanMapper.toScannedBlankResponse(savedBlank), "Scanned blank submitted successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
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

            // Serialize errorCorrections Object to JSON string
            String errorCorrectionsJson = objectMapper.writeValueAsString(errorCorrections);

            // Set the corrections on the blank
            blank.setErrorCorrections(errorCorrectionsJson);
            blank.setIsErrorCorrectionApplied(true);
            blank.setReviewStatus(ScannedBlank.ReviewStatus.CORRECTED);
            blank.setReviewedAt(LocalDateTime.now());
            blank.setReviewedBy(getCurrentUser());

            ScannedBlank updated = scannedBlankRepository.save(blank);

            return Response.success(scanMapper.toScannedBlankResponse(updated), "Error corrections applied successfully");

        } catch (NotFoundException e) {
            log.error("Not found error: {}", e.getMessage());
            return Response.error(e.getMessage(), 404);
        } catch (Exception e) {
            log.error("Error applying corrections", e);
            return Response.error("Failed to apply corrections: " + e.getMessage(), 500);
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
}

