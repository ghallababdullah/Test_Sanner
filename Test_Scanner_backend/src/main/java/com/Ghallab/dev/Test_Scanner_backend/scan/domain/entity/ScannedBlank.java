package com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ScannedBlank entity representing a single scanned exam blank
 * Contains ONLY RAW OCR DATA - NO SCORING/GRADING
 *
 * This entity stores:
 * - Student information extracted from the blank
 * - Raw OCR answers (as JSON string)
 * - Error corrections made by student on the blank (as JSON string)
 * - OCR quality metrics
 *
 * Grading is handled by GradingResult in the grading module
 */
@Entity
@Table(name = "scanned_blanks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ScannedBlank extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_session_id", nullable = false)
    private ScanSession scanSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_by")
    private User scannedBy; // User who scanned (teacher)

    // ==================== STUDENT INFO (FROM BLANK) ====================
    @Column(name = "student_name", nullable = false, length = 200)
    private String studentName;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    @Column(name = "test_date")
    private LocalDate testDate;

    // ==================== RAW ANSWERS (OCR EXTRACTION) ====================
    @Column(name = "answers", nullable = false, columnDefinition = "TEXT")
    private String answers; // Original extracted answers from OCR (JSON string format)

    // ==================== ERROR CORRECTIONS ====================
    @Column(name = "error_corrections", columnDefinition = "TEXT")
    private String errorCorrections; // Student corrections on the blank (JSON string format)

    @Column(name = "is_error_correction_applied", nullable = false)
    private Boolean isErrorCorrectionApplied = false;

    // ==================== OCR QUALITY METRICS ====================
    @DecimalMin(value = "0", message = "Confidence must be between 0 and 1")
    @DecimalMax(value = "1", message = "Confidence must be between 0 and 1")
    @Column(name = "overall_confidence", precision = 5, scale = 4)
    private BigDecimal overallConfidence; // Quality of OCR recognition

    @Column(name = "needs_review", nullable = false)
    private Boolean needsReview = false; // Flag for manual review

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    // ==================== TIMESTAMPS ====================
    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    public enum ReviewStatus {
        PENDING,    // Waiting for review
        REVIEWED,   // Manual review completed
        CORRECTED,  // Corrected during review
        SKIPPED     // Marked to skip/ignore
    }
}
