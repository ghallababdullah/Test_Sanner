package com.Ghallab.dev.Test_Scanner_backend.scan.domain.event;

import com.Ghallab.dev.Test_Scanner_backend.shared.event.DomainEvent;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Event published when a scanned blank image is ready for OCR processing.
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ScanRequestedEvent extends DomainEvent {
    private UUID blankId;
    private UUID scanSessionId;
    private UUID testId;
    private String imagePath;
    private LocalDate testDate;

    public ScanRequestedEvent(
            UUID eventId,
            UUID blankId,
            UUID scanSessionId,
            UUID testId,
            String imagePath,
            LocalDate testDate
    ) {
        super(eventId);
        this.blankId = blankId;
        this.scanSessionId = scanSessionId;
        this.testId = testId;
        this.imagePath = imagePath;
        this.testDate = testDate;
    }
}
