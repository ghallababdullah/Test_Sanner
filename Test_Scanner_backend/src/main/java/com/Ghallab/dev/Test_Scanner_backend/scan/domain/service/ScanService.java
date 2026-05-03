package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankDetailedResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.StartScanSessionRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.UploadScannedBlankRequest;

import java.util.List;
import java.util.UUID;

/**
 * ScanService interface for scanning operations.
 * Handles scan intake and OCR lifecycle for scanned blanks.
 * Does NOT handle grading - that's GradingService's job
 */
public interface ScanService {

    /**
     * Start a new scanning session
     * A session groups multiple scans of blanks from one test
     */
    Response<ScanSessionResponse> startScanSession(StartScanSessionRequest request);

    /**
     * Receive an uploaded scanned blank image and create an OCR job record.
     */
    Response<ScannedBlankResponse> submitScannedBlank(UploadScannedBlankRequest request);

    /**
     * Get all scanned blanks for a specific test
     */
    Response<List<ScannedBlankResponse>> getScannedBlanksByTest(UUID testId);

    /**
     * Get all scanned blanks for a specific scanning session
     */
    Response<List<ScannedBlankResponse>> getScannedBlanksBySession(UUID sessionId);

    /**
     * Get a specific scanned blank
     */
    Response<ScannedBlankResponse> getScannedBlankById(UUID blankId);

    /**
     * Get a scanned blank together with final answers and scoring details.
     */
    Response<ScannedBlankDetailedResponse> getScannedBlankDetails(UUID blankId);

    /**
     * Mark scanned blank as needs review
     */
    Response<ScannedBlankResponse> markForReview(UUID blankId, String reviewNotes);

    /**
     * Apply error corrections to a scanned blank
     * Takes errorCorrections from request and applies them
     */
    Response<ScannedBlankResponse> applyErrorCorrections(UUID blankId, Object errorCorrections);

    /**
     * Retry OCR for a specific scanned blank by re-publishing its OCR job.
     */
    Response<ScannedBlankResponse> retryOcr(UUID blankId);
}

