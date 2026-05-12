package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanPreviewService {

    private final ObjectMapper objectMapper;

    public String generatePreviewAndCopyArtifacts(String originalImagePath, ScanFileStorageService storageService) {
        try {
            String pythonCommand = System.getenv().getOrDefault("PYTHON_CMD", "python");
            String configuredProjectDir = System.getenv("PYTHON_PROJECT_DIR");
            Path pythonProjectDir;
            if (configuredProjectDir != null && !configuredProjectDir.isBlank()) {
                pythonProjectDir = Path.of(configuredProjectDir).toAbsolutePath().normalize();
            } else {
                Path repoRoot = Path.of("").toAbsolutePath().normalize().getParent();
                if (repoRoot == null) {
                    throw new IllegalStateException("Failed to resolve repository root");
                }
                pythonProjectDir = repoRoot.resolve("Python_CV_OCR").normalize();
            }
            Path scriptPath = pythonProjectDir.resolve("roi_preview.py").normalize();

            List<String> command = new ArrayList<>();
            command.add(pythonCommand);
            command.add(scriptPath.toString());
            command.add(originalImagePath);

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(pythonProjectDir.toFile());
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append(System.lineSeparator());
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IllegalStateException("ROI preview command failed: " + output);
            }

            String jsonLine = extractLastJsonLine(output.toString());
            JsonNode root = objectMapper.readTree(jsonLine);
            String processedImagePath = root.path("processedImagePath").asText(null);
            return storageService.copyOcrArtifactsToStorage(originalImagePath, processedImagePath);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate ROI preview: " + e.getMessage(), e);
        }
    }

    private String extractLastJsonLine(String output) {
        String[] lines = output.split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (line.startsWith("{") && line.endsWith("}")) {
                return line;
            }
        }
        throw new IllegalStateException("ROI preview command did not return JSON payload");
    }
}
