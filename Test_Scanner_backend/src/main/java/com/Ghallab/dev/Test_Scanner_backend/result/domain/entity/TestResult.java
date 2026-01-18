package com.Ghallab.dev.Test_Scanner_backend.result.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

/**
 * TestResult entity representing the final scoring result of a scanned blank
 * Contains total score, percentage, and assigned grade
 */
@Entity
@Table(name = "test_results")
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TestResult extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_blank_id", nullable = false)
    private ScannedBlank scannedBlank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "total_score", precision = 10, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "max_score", precision = 10, scale = 2)
    private BigDecimal maxScore;

    @DecimalMin(value = "0", message = "Percentage must be between 0 and 100")
    @DecimalMax(value = "100", message = "Percentage must be between 0 and 100")
    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "grade", length = 2)
    private String grade;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ResultStatus status = ResultStatus.COMPLETED;

    public enum ResultStatus {
        COMPLETED,
        REVIEWED,
        ARCHIVED
    }
}

