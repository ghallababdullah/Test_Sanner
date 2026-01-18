package com.Ghallab.dev.Test_Scanner_backend.result.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScanSession;
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

/**
 * TestAnalytics entity representing statistical analysis of a test
 * Contains aggregated statistics, grade distribution, and question analysis
 */
@Entity
@Table(name = "test_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TestAnalytics extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_session_id")
    private ScanSession scanSession;

    // Basic Stats
    @Column(name = "total_blanks", nullable = false)
    private Integer totalBlanks = 0;

    @DecimalMin(value = "0", message = "Average score must be at least 0")
    @DecimalMax(value = "100", message = "Average score cannot exceed 100")
    @Column(name = "average_score", precision = 5, scale = 2)
    private BigDecimal averageScore;

    @DecimalMin(value = "0", message = "Median score must be at least 0")
    @DecimalMax(value = "100", message = "Median score cannot exceed 100")
    @Column(name = "median_score", precision = 5, scale = 2)
    private BigDecimal medianScore;

    @DecimalMin(value = "0", message = "Highest score must be at least 0")
    @DecimalMax(value = "100", message = "Highest score cannot exceed 100")
    @Column(name = "highest_score", precision = 5, scale = 2)
    private BigDecimal highestScore;

    @DecimalMin(value = "0", message = "Lowest score must be at least 0")
    @DecimalMax(value = "100", message = "Lowest score cannot exceed 100")
    @Column(name = "lowest_score", precision = 5, scale = 2)
    private BigDecimal lowestScore;

    @Column(name = "standard_deviation", precision = 5, scale = 2)
    private BigDecimal standardDeviation;

    // Grade Distribution
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grade_distribution", nullable = false, columnDefinition = "jsonb")
    private JsonNode gradeDistribution;

    // Question Analysis (per-question stats)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "question_analysis", columnDefinition = "jsonb")
    private JsonNode questionAnalysis;

    // Error Analysis
    @Column(name = "total_corrections")
    private Integer totalCorrections = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "common_corrections", columnDefinition = "jsonb")
    private JsonNode commonCorrections;

    // Timing
    @Column(name = "average_processing_time_ms")
    private Integer averageProcessingTimeMs;

    // Generated timestamp
    @Column(name = "generated_at", nullable = false)
    private java.time.LocalDateTime generatedAt;
}

