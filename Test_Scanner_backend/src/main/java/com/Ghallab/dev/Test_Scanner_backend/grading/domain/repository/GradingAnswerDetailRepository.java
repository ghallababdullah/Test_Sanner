package com.Ghallab.dev.Test_Scanner_backend.grading.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingAnswerDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * GradingAnswerDetailRepository - Repository for GradingAnswerDetail entity
 * Provides database access for answer details
 */
@Repository
public interface GradingAnswerDetailRepository extends JpaRepository<GradingAnswerDetail, UUID> {

    /**
     * Find all answer details for a specific grading result
     */
    List<GradingAnswerDetail> findByGradingResultId(UUID gradingResultId);

    /**
     * Find answer details by question number and grading result
     */
    GradingAnswerDetail findByGradingResultIdAndQuestionNumber(UUID gradingResultId, Integer questionNumber);

    /**
     * Find all incorrect answers for analysis
     */
    List<GradingAnswerDetail> findByGradingResultIdAndIsCorrectFalse(UUID gradingResultId);

    /**
     * Get most wrong questions for a test - for analytics
     */
    @Query(value = """
        SELECT 
            gad.question_number,
            COUNT(CASE WHEN gad.is_correct = false THEN 1 END) as timesWrong,
            (COUNT(CASE WHEN gad.is_correct = false THEN 1 END) * 100.0 / COUNT(gad.id)) as percentageWrong
        FROM GradingAnswerDetail gad
        JOIN GradingResult gr ON gad.grading_result_id = gr.id
        WHERE gr.test_id = :testId
        GROUP BY gad.question_number
        ORDER BY percentageWrong DESC
    """, nativeQuery = true)
    List<Object[]> getMostWrongQuestions(@Param("testId") UUID testId);
}

