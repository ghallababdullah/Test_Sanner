package com.Ghallab.dev.Test_Scanner_backend.grading.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * GradingResultRepository - Repository for GradingResult entity
 * Provides database access for grading results
 */
@Repository
public interface GradingResultRepository extends JpaRepository<GradingResult, UUID> {

    /**
     * Find all grading results for a specific test
     */
    List<GradingResult> findByTestId(UUID testId);

    /**
     * Find all grading results for a specific user
     */
    List<GradingResult> findByUserId(UUID userId);

    /**
     * Find grading result for a specific student and test
     */
    Optional<GradingResult> findByTestIdAndUserId(UUID testId, UUID userId);

    /**
     * Get statistics for a test - used for analytics
     */
    @Query(value = """
        SELECT 
            AVG(gr.percentage) as averagePercentage,
            COUNT(gr.id) as totalAttempts
        FROM GradingResult gr
        WHERE gr.test.id = :testId
    """)
    Optional<Object[]> getTestStatistics(@Param("testId") UUID testId);

    /**
     * Check if a student already has a grading result for a test
     */
    boolean existsByTestIdAndUserId(UUID testId, UUID userId);
}

