package com.Ghallab.dev.Test_Scanner_backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Configuration for JPA Auditing
 * Enables @CreatedDate and @LastModifiedDate annotations
 */
@Configuration
@EnableJpaAuditing
public class AuditingConfig {

    /**
     * Provides current date/time for auditing
     * Uses LocalDateTime.now() for @CreatedDate and @LastModifiedDate
     */
    @Bean
    public DateTimeProvider dateTimeProvider() {
        return () -> Optional.of(LocalDateTime.now());
    }
}

