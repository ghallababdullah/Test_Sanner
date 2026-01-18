package com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScanSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ScanSession entity
 */
@Repository
public interface ScanSessionRepository extends JpaRepository<ScanSession, UUID> {
    List<ScanSession> findByTestId(UUID testId);

    List<ScanSession> findByUserId(UUID userId);
}

