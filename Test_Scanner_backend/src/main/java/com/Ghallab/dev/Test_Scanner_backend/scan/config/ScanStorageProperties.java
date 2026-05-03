package com.Ghallab.dev.Test_Scanner_backend.scan.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.scan.storage")
public record ScanStorageProperties(
        String rootDir,
        boolean copyOcrArtifacts,
        String pythonOutputRoot
) {
}
