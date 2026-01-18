package com.Ghallab.dev.Test_Scanner_backend.scan.domain.event;

import com.Ghallab.dev.Test_Scanner_backend.shared.event.DomainEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Event published when a scan session is completed
 * Triggers grading and result processing
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ScanCompletedEvent extends DomainEvent {
    private UUID scanSessionId;
    private UUID testId;
    private Integer totalBlanksScanned;
    private Integer failedBlanks;

    public ScanCompletedEvent(UUID eventId, UUID scanSessionId, UUID testId,
                             Integer totalBlanksScanned, Integer failedBlanks) {
        super(eventId);
        this.scanSessionId = scanSessionId;
        this.testId = testId;
        this.totalBlanksScanned = totalBlanksScanned;
        this.failedBlanks = failedBlanks;
    }
}

