package com.Ghallab.dev.Test_Scanner_backend.security.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.security.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserId(UUID userId);

    List<AuditLog> findByAction(String action);

    List<AuditLog> findByPerformedAtBetween(LocalDateTime startTime, LocalDateTime endTime);
}

