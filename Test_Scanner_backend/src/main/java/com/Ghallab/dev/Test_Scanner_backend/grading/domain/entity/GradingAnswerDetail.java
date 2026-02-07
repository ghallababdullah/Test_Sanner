package com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

/**
 * GradingAnswerDetail entity representing individual answer details in a grading result
 * Stores student's answer, correct answer, and scoring information
 *
 * matchType values:
 * - EXACT: answer matches perfectly
 * - TOLERANCE_1: answer differs by 1 character (Levenshtein distance = 1)
 * - TOLERANCE_2: answer differs by 2 characters (Levenshtein distance = 2)
 * - NO_MATCH: answer differs too much or is empty
 */
@Entity
@Table(name = "grading_answer_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GradingAnswerDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grading_result_id", nullable = false)
    private GradingResult gradingResult;

    @Min(value = 1, message = "Question number must be at least 1")
    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @NotBlank(message = "Student answer is required")
    @Column(name = "student_answer", length = 500, nullable = false)
    private String studentAnswer;

    @NotBlank(message = "Correct answer is required")
    @Column(name = "correct_answer", length = 500, nullable = false)
    private String correctAnswer;

    @DecimalMin(value = "0", message = "Points earned must be at least 0")
    @Column(name = "points_earned", precision = 5, scale = 2, nullable = false)
    private BigDecimal pointsEarned;

    @DecimalMin(value = "0", message = "Max points must be at least 0")
    @Column(name = "max_points", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxPoints;

    @Min(value = 0, message = "Distance must be at least 0")
    @Column(name = "distance", nullable = false)
    private Integer distance; // Levenshtein distance

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect; // true if pointsEarned == maxPoints

    @Column(name = "match_type", length = 50)
    private String matchType; // EXACT, TOLERANCE_1, TOLERANCE_2, NO_MATCH
}

