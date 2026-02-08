package com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import jakarta.persistence.*;
import lombok.*;

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
    private User user; // Teacher who is scanning (has email in User table)

    @Column(name = "name", length = 200)
    private String name; // Name of this scanning session (e.g., "Сеанс 8 февраля класс 10A")

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "device_model", length = 100)
    private String deviceModel;

    @Column(name = "total_blanks", nullable = false)
    private Integer totalBlanks = 0; // Total blanks scanned in this session

    @Column(name = "started_at", nullable = false)
    private java.time.LocalDateTime startedAt;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // Device info as JSON string (e.g., {"ocrLibrary": "TensorFlow"})
}

