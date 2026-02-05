package com.Ghallab.dev.Test_Scanner_backend.test.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Test entity representing a test/exam created by a teacher
 * Contains metadata about the test
 */
@Entity
@Table(name = "tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Test extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User creator;

    @NotBlank(message = "Test title is required")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Min(value = 1, message = "Total questions must be at least 1")
    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "max_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnswerKey> answerKeys = new ArrayList<>();

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GradeThreshold> gradeThreshold = new ArrayList<>();
}

