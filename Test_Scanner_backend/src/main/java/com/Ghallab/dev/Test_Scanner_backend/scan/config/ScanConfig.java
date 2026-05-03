package com.Ghallab.dev.Test_Scanner_backend.scan.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        ScanStorageProperties.class,
        ScanMessagingProperties.class
})
public class ScanConfig {
}
