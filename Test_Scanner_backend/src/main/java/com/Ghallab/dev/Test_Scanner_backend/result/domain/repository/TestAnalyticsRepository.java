package com.Ghallab.dev.Test_Scanner_backend.result.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.TestAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TestAnalytics entity
 */
@Repository
public interface TestAnalyticsRepository extends JpaRepository<TestAnalytics, UUID> {
    Optional<TestAnalytics> findByTestId(UUID testId);

    List<TestAnalytics> findByScanSessionId(UUID scanSessionId);
}

