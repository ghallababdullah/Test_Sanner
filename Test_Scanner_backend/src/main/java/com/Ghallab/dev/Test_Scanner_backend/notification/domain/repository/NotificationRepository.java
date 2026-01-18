package com.Ghallab.dev.Test_Scanner_backend.notification.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.notification.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Notification entity
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserId(UUID userId);

    List<Notification> findByUserIdAndIsReadFalse(UUID userId);
}

