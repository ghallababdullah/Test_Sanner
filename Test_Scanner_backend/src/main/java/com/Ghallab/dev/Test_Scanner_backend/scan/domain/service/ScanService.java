package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.StartScanSessionRequest;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.UploadScannedBlankRequest;

import java.util.List;
import java.util.UUID;

/**
 * ScanService interface for scanning operations
 * Handles raw data extraction from scanned blanks (OCR data)
 * Does NOT handle grading - that's GradingService's job
 */
public interface ScanService {

    /**
     * Start a new scanning session
     * A session groups multiple scans of blanks from one test
     */
    Response<ScanSessionResponse> startScanSession(StartScanSessionRequest request);

    /**
     * Submit a scanned blank with extracted OCR data
     * Frontend performs OCR on phone, backend saves the raw data
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
     * Mark scanned blank as needs review
     */
    Response<ScannedBlankResponse> markForReview(UUID blankId, String reviewNotes);

    /**
     * Apply error corrections to a scanned blank
     * Takes errorCorrections from request and applies them
     */
    Response<ScannedBlankResponse> applyErrorCorrections(UUID blankId, Object errorCorrections);
}

