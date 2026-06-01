package com.Ghallab.dev.Test_Scanner_backend.scan.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.service.ScanService;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankDetailedResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.RoiMetaResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.RoiBoxResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.RoiOverridesRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.StartScanSessionRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.UploadScannedBlankRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ScanController
 * API endpoints for scanning operations
 * Handles scanned blank intake and retrieval
 * Does NOT handle grading - that's GradingController
 */
@RestController
@RequestMapping("/api/scan")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ScanController {

    private final ScanService scanService;

    private <T> ResponseEntity<Response<T>> respond(Response<T> response) {
        int statusCode = response != null ? response.getStatusCode() : 500;
        HttpStatus status = HttpStatus.resolve(statusCode);
        return ResponseEntity.status(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Start a new scanning session
     * POST /api/scan/start-session
     *
     * Body:
     * {
     *   "testId": "uuid",
     *   "name": "Session name",
     *   "description": "Description",
     *   "deviceId": "device123",
     *   "deviceModel": "iPhone 14",
     *   "metadata": {...}
     * }
     */
    @PostMapping("/start-session")
    public ResponseEntity<Response<ScanSessionResponse>> startScanSession(
            @Valid @RequestBody StartScanSessionRequest request) {
        log.info("Starting scan session for test: {}", request.getTestId());
        Response<ScanSessionResponse> response = scanService.startScanSession(request);
        return respond(response);
    }

    /**
     * Submit a scanned blank with extracted OCR data
     * POST /api/scan/submit-blank
     *
     * Body:
     * {
     *   "scanSessionId": "uuid",
     *   "testId": "uuid",
     *   "studentName": "Иван",
     *   "studentLastName": "Петров",
     *   "studentClass": "10A",
     *   "testDate": "2026-02-08",
     *   "answers": {"1": "ABC", "2": "123"},
     *   "overallConfidence": 0.92,
     *   "errorCorrections": null,
     *   "isErrorCorrectionApplied": false
     * }
     */
    @PostMapping(value = "/submit-blank", consumes = {"multipart/form-data"})
    public ResponseEntity<Response<ScannedBlankResponse>> submitScannedBlank(
            @Valid @ModelAttribute UploadScannedBlankRequest request) {
        MultipartFile image = request.getImage();
        log.info("Uploading scanned blank image for test: {}, file: {}",
                request.getTestId(),
                image != null ? image.getOriginalFilename() : "<missing>");
        Response<ScannedBlankResponse> response = scanService.submitScannedBlank(request);
        return respond(response);
    }

    @PostMapping(value = "/submit-blank-preview", consumes = {"multipart/form-data"})
    public ResponseEntity<Response<ScannedBlankResponse>> submitScannedBlankForPreview(
            @Valid @ModelAttribute UploadScannedBlankRequest request) {
        MultipartFile image = request.getImage();
        log.info("Uploading scanned blank image for ROI preview, test: {}, file: {}",
                request.getTestId(),
                image != null ? image.getOriginalFilename() : "<missing>");
        Response<ScannedBlankResponse> response = scanService.submitScannedBlankForPreview(request);
        return respond(response);
    }

    /**
     * Get all scanned blanks for a specific test
     * GET /api/scan/test/{testId}/blanks
     */
    @GetMapping("/test/{testId}/blanks")
    public ResponseEntity<Response<List<ScannedBlankResponse>>> getScannedBlanksByTest(
            @PathVariable UUID testId) {
        log.info("Fetching scanned blanks for test: {}", testId);
        Response<List<ScannedBlankResponse>> response = scanService.getScannedBlanksByTest(testId);
        return respond(response);
    }

    /**
     * Get all scanned blanks for a specific scanning session
     * GET /api/scan/session/{sessionId}/blanks
     */
    @GetMapping("/session/{sessionId}/blanks")
    public ResponseEntity<Response<List<ScannedBlankResponse>>> getScannedBlanksBySession(
            @PathVariable UUID sessionId) {
        log.info("Fetching scanned blanks for session: {}", sessionId);
        Response<List<ScannedBlankResponse>> response = scanService.getScannedBlanksBySession(sessionId);
        return respond(response);
    }

    /**
     * Get a specific scanned blank
     * GET /api/scan/blank/{blankId}
     */
    @GetMapping("/blank/{blankId}")
    public ResponseEntity<Response<ScannedBlankResponse>> getScannedBlankById(
            @PathVariable UUID blankId) {
        log.info("Fetching scanned blank: {}", blankId);
        Response<ScannedBlankResponse> response = scanService.getScannedBlankById(blankId);
        return respond(response);
    }

    @GetMapping("/blank/{blankId}/asset/{kind}")
    public ResponseEntity<Resource> getScannedBlankAsset(
            @PathVariable UUID blankId,
            @PathVariable String kind) {
        log.info("Fetching scanned blank asset: {} / {}", blankId, kind);

        Path path = scanService.resolveBlankAssetPath(blankId, kind);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(path);
        MediaType mediaType = MediaTypeFactory.getMediaType(path.getFileName().toString())
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .contentType(mediaType)
                .body(resource);
    }

    @GetMapping("/blank/{blankId}/roi-metadata")
    public ResponseEntity<Response<List<RoiMetaResponse>>> getBlankRoiMetadata(
            @PathVariable UUID blankId) {
        log.info("Fetching ROI metadata for blank: {}", blankId);
        Response<List<RoiMetaResponse>> response = scanService.getBlankRoiMetadata(blankId);
        return respond(response);
    }

    @GetMapping("/blank/{blankId}/roi-overrides")
    public ResponseEntity<Response<Map<String, RoiBoxResponse>>> getBlankRoiOverrides(
            @PathVariable UUID blankId) {
        log.info("Fetching ROI overrides for blank: {}", blankId);
        Response<Map<String, RoiBoxResponse>> response = scanService.getBlankRoiOverrides(blankId);
        return respond(response);
    }

    @PutMapping("/blank/{blankId}/roi-overrides")
    public ResponseEntity<Response<Map<String, RoiBoxResponse>>> saveBlankRoiOverrides(
            @PathVariable UUID blankId,
            @RequestBody(required = false) RoiOverridesRequest request) {
        log.info("Saving ROI overrides for blank: {}", blankId);
        Response<Map<String, RoiBoxResponse>> response = scanService.saveBlankRoiOverrides(
                blankId,
                request != null ? request.getOverrides() : null
        );
        return respond(response);
    }

    @DeleteMapping("/blank/{blankId}")
    public ResponseEntity<Response<String>> deleteScannedBlank(
            @PathVariable UUID blankId) {
        log.info("Deleting scanned blank: {}", blankId);
        Response<String> response = scanService.deleteScannedBlank(blankId);
        return respond(response);
    }

    /**
     * Get a detailed scanned blank view including final answers and scoring details.
     * GET /api/scan/blank/{blankId}/details
     */
    @GetMapping("/blank/{blankId}/details")
    public ResponseEntity<Response<ScannedBlankDetailedResponse>> getScannedBlankDetails(
            @PathVariable UUID blankId) {
        log.info("Fetching scanned blank details: {}", blankId);
        Response<ScannedBlankDetailedResponse> response = scanService.getScannedBlankDetails(blankId);
        return respond(response);
    }

    /**
     * Mark scanned blank as needing review
     * PUT /api/scan/blank/{blankId}/mark-review
     *
     * Params:
     * reviewNotes: "Some notes about why review is needed"
     */
    @PutMapping("/blank/{blankId}/mark-review")
    public ResponseEntity<Response<ScannedBlankResponse>> markForReview(
            @PathVariable UUID blankId,
            @RequestParam(required = false) String reviewNotes) {
        log.info("Marking scanned blank for review: {}", blankId);
        Response<ScannedBlankResponse> response = scanService.markForReview(blankId, reviewNotes);
        return respond(response);
    }

    /**
     * Apply error corrections to a scanned blank
     * PUT /api/scan/blank/{blankId}/apply-corrections
     *
     * Request body:
     * {
     *   "errorCorrections": {
     *     "questionNumber": "correctedAnswer",
     *     ...
     *   }
     * }
     */
    @PutMapping("/blank/{blankId}/apply-corrections")
    public ResponseEntity<Response<ScannedBlankResponse>> applyErrorCorrections(
            @PathVariable UUID blankId,
            @RequestBody(required = false) Map<String, Object> request) {
        log.info("Applying error corrections to blank: {}", blankId);

        // Extract errorCorrections from request body
        Object errorCorrections = request != null ? request.get("errorCorrections") : null;

        Response<ScannedBlankResponse> response = scanService.applyErrorCorrections(blankId, errorCorrections);
        return respond(response);
    }

    @PostMapping("/blank/{blankId}/retry-ocr")
    public ResponseEntity<Response<ScannedBlankResponse>> retryOcr(
            @PathVariable UUID blankId) {
        log.info("Retrying OCR for blank: {}", blankId);
        Response<ScannedBlankResponse> response = scanService.retryOcr(blankId);
        return respond(response);
    }

    @PostMapping("/blank/{blankId}/refresh-preview")
    public ResponseEntity<Response<ScannedBlankResponse>> refreshPreview(
            @PathVariable UUID blankId) {
        log.info("Refreshing ROI preview for blank: {}", blankId);
        Response<ScannedBlankResponse> response = scanService.refreshPreview(blankId);
        return respond(response);
    }
}

