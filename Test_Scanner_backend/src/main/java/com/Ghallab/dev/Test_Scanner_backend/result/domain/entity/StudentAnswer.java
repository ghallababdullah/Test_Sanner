package com.Ghallab.dev.Test_Scanner_backend.result.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
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
 * StudentAnswer entity representing individual answer grading details
 * Stores the student's answer, correct answer, and points awarded
 */
@Entity
@Table(name = "answer_grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class StudentAnswer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_blank_id", nullable = false)
    private ScannedBlank scannedBlank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_key_id")
    private AnswerKey answerKey;

    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @Column(name = "correct_answer", length = 500)
    private String correctAnswer;

    @Column(name = "student_answer", length = 500)
    private String studentAnswer;

    @Column(name = "final_answer", length = 500)
    private String finalAnswer;

    @DecimalMin(value = "0", message = "Score must be between 0 and max points")
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "max_points", precision = 5, scale = 2)
    private BigDecimal maxPoints;

    @Column(name = "match_type", length = 50)
    private String matchType; // EXACT, TOLERANCE_1, TOLERANCE_2, NO_MATCH

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private JsonNode metadata;
}

