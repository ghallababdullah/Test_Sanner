package com.Ghallab.dev.Test_Scanner_backend.test.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

/**
 * AnswerKey entity representing the correct answer for a specific question
 * in a test, with tolerance levels for slight variations
 */
@Entity
@Table(name = "answer_keys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AnswerKey extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Min(value = 1, message = "Question number must be at least 1")
    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @NotBlank(message = "Correct answer is required")
    @Column(name = "correct_answer", nullable = false, columnDefinition = "VARCHAR(500)")
    private String correctAnswer;

    @Column(name = "max_points", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxPoints = BigDecimal.ONE;

    @Min(value = 1, message = "Tolerance level must be at least 1")
    @Column(name = "tolerance_level", nullable = false)
    private Integer toleranceLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_type", nullable = false)
    private AnswerType answerType = AnswerType.TEXT;

    public enum AnswerType {
        TEXT,
        MULTIPLE_CHOICE,
        NUMERIC
    }
}

