package com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * GradingResult entity representing the result of grading a student's answers
 * INDEPENDENT from Result Package - used for manual grading without scanning
 *
 * Structure:
 * - One test can have multiple grading results (from different students)
 * - One student can have multiple grading results (from different tests)
 * - Each result has many answer details
 */
@Entity
@Table(name = "grading_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GradingResult extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL) // TODO : Change to LAZY if performance issues arise
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ==================== STUDENT INFORMATION (FROM BLANK) ====================
    // These fields store the student's information as written on the paper/blank
    // This allows us to know WHO took the test even if they're not in the User table

    @Column(name = "student_name", length = 200, nullable = false)
    private String studentName;

    @Column(name = "student_last_name", length = 200 , nullable = false)
    private String studentLastName;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    // ==================== SCORING RESULTS ====================

    @Column(name = "raw_score", precision = 8, scale = 2, nullable = false)
    private BigDecimal rawScore;

    @Column(name = "max_score", precision = 8, scale = 2, nullable = false)
    private BigDecimal maxScore;

    @DecimalMin(value = "0", message = "Percentage must be between 0 and 100")
    @DecimalMax(value = "100", message = "Percentage must be between 0 and 100")
    @Column(name = "percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal percentage;

    @Column(name = "grade", length = 2)
    private String grade; // "5", "4", "3", "2"

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @OneToMany(mappedBy = "gradingResult", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<GradingAnswerDetail> answerDetails;
}

