package com.Ghallab.dev.Test_Scanner_backend.result.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TestResult entity
 */
@Repository
public interface TestResultRepository extends JpaRepository<TestResult, UUID> {
    Optional<TestResult> findByScannedBlankId(UUID scannedBlankId);

    List<TestResult> findByTestId(UUID testId);

    List<TestResult> findByTestIdIn(List<UUID> testIds);

    List<TestResult> findByScannedBlankTestId(UUID testId);

    List<TestResult> findByScannedBlankTestIdIn(List<UUID> testIds);

    List<TestResult> findByScannedBlankIdIn(List<UUID> blankIds);

    void deleteByScannedBlankId(UUID scannedBlankId);
}

