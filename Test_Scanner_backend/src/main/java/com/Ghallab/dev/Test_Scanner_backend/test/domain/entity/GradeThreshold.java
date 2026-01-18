package com.Ghallab.dev.Test_Scanner_backend.test.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * GradeThreshold entity representing the grading scale for a test
 * Maps percentage ranges to letter grades (e.g., 91-100% = 5, 71-90% = 4)
 */
@Entity
@Table(name = "grade_thresholds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GradeThreshold extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @NotBlank(message = "Grade name is required")
    @Column(name = "grade_name", nullable = false, length = 20)
    private String gradeName;

    @NotBlank(message = "Grade symbol is required")
    @Column(name = "grade_symbol", nullable = false, length = 2)
    private String gradeSymbol;

    @Min(value = 0, message = "Min percentage must be at least 0")
    @Max(value = 100, message = "Min percentage cannot exceed 100")
    @Column(name = "min_percentage", nullable = false)
    private Integer minPercentage;

    @Min(value = 0, message = "Max percentage must be at least 0")
    @Max(value = 100, message = "Max percentage cannot exceed 100")
    @Column(name = "max_percentage", nullable = false)
    private Integer maxPercentage;
}

