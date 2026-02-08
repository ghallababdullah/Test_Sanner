package com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ScannedBlank entity
 * Provides data access for raw OCR scan data
 */
@Repository
public interface ScannedBlankRepository extends JpaRepository<ScannedBlank, UUID> {

    List<ScannedBlank> findByScanSessionId(UUID scanSessionId);

    List<ScannedBlank> findByTestId(UUID testId);

    List<ScannedBlank> findByNeedsReviewTrue();
}



