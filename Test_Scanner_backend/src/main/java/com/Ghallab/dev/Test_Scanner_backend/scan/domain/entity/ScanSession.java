package com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * ScanSession entity representing a scanning session
 * A session contains multiple scanned blanks from one scanning batch
 */
@Entity
@Table(name = "scan_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ScanSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "name", length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "device_model", length = 100)
    private String deviceModel;

    @Column(name = "total_blanks", nullable = false)
    private Integer totalBlanks = 0;

    @Column(name = "processed_blanks", nullable = false)
    private Integer processedBlanks = 0;

    @Column(name = "failed_blanks", nullable = false)
    private Integer failedBlanks = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ScanStatus status = ScanStatus.PENDING;

    @Column(name = "started_at", nullable = false)
    private java.time.LocalDateTime startedAt;

    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private JsonNode metadata;

    public enum ScanStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}

