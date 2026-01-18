package com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ScannedBlank entity representing a single scanned exam blank
 * Contains original answers, corrections, final answers, and scoring
 */
@Entity
@Table(name = "scanned_blanks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ScannedBlank extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_session_id")
    private ScanSession scanSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    // Student info extracted from blank
    @Column(name = "student_name", nullable = false, length = 200)
    private String studentName;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    @Column(name = "test_date")
    private LocalDate testDate;

    // OCR Quality
    @DecimalMin(value = "0", message = "Confidence must be between 0 and 1")
    @DecimalMax(value = "1", message = "Confidence must be between 0 and 1")
    @Column(name = "overall_confidence", precision = 5, scale = 4)
    private BigDecimal overallConfidence;

    @Column(name = "needs_review", nullable = false)
    private Boolean needsReview = false;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    // Original answers from scanning
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers", nullable = false, columnDefinition = "jsonb")
    private JsonNode answers;

    // Error corrections
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "error_corrections", columnDefinition = "jsonb")
    private JsonNode errorCorrections;

    @Column(name = "is_error_correction_applied", nullable = false)
    private Boolean isErrorCorrectionApplied = false;

    // Final answers after corrections
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "final_answers", columnDefinition = "jsonb")
    private JsonNode finalAnswers;

    // Scoring
    @Column(name = "is_scored", nullable = false)
    private Boolean isScored = false;

    @Column(name = "raw_score", precision = 8, scale = 2)
    private BigDecimal rawScore = BigDecimal.ZERO;

    @Column(name = "max_score", precision = 8, scale = 2)
    private BigDecimal maxScore;

    @DecimalMin(value = "0", message = "Percentage must be between 0 and 100")
    @DecimalMax(value = "100", message = "Percentage must be between 0 and 100")
    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "grade", length = 2)
    private String grade;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    // Image paths
    @Column(name = "original_image_path")
    private String originalImagePath;

    @Column(name = "processed_image_path")
    private String processedImagePath;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    // Timestamps
    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "scored_at")
    private LocalDateTime scoredAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    public enum ReviewStatus {
        PENDING,
        REVIEWED,
        CORRECTED,
        SKIPPED
    }
}

