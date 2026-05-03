package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.scan.config.ScanMessagingProperties;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.event.ScanRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanJobPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ScanMessagingProperties messagingProperties;

    public void publishScanRequested(ScannedBlank blank) {
        ScanRequestedEvent event = new ScanRequestedEvent(
                UUID.randomUUID(),
                blank.getId(),
                blank.getScanSession().getId(),
                blank.getTest().getId(),
                blank.getOriginalImagePath(),
                blank.getTestDate()
        );

        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKey(),
                event
        );

        log.info(
                "Published ScanRequestedEvent for blank: {} to exchange='{}' routingKey='{}'",
                blank.getId(),
                messagingProperties.exchange(),
                messagingProperties.routingKey()
        );
    }
}
