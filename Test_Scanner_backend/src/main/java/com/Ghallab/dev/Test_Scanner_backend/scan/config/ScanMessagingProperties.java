package com.Ghallab.dev.Test_Scanner_backend.scan.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.scan.messaging")
public record ScanMessagingProperties(
        String exchange,
        String routingKey,
        String requestQueue,
        String resultRoutingKey,
        String resultQueue
) {
}
