package com.Ghallab.dev.Test_Scanner_backend.shared.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base class for all domain events
 * Used for asynchronous communication between modules
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class DomainEvent {
    private UUID eventId;
    private LocalDateTime occurredAt;

    protected DomainEvent(UUID eventId) {
        this.eventId = eventId;
        this.occurredAt = LocalDateTime.now();
    }
}

