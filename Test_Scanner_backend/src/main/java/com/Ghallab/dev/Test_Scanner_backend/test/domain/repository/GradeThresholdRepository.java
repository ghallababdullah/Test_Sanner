package com.Ghallab.dev.Test_Scanner_backend.test.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for GradeThreshold entity
 */
@Repository
public interface GradeThresholdRepository extends JpaRepository<GradeThreshold, UUID> {
    List<GradeThreshold> findByTestId(UUID testId);

    List<GradeThreshold> findByTestIdOrderByMinPercentageAsc(UUID testId);
}

