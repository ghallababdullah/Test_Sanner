package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.scan.config.ScanStorageProperties;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class ScanFileStorageService {

    private final Path rootDir;
    private final boolean copyOcrArtifacts;
    private final Path pythonOutputRoot;

    public ScanFileStorageService(ScanStorageProperties properties) {
        this.rootDir = Path.of(properties.rootDir()).toAbsolutePath().normalize();
        this.copyOcrArtifacts = properties.copyOcrArtifacts();
        this.pythonOutputRoot = Path.of(properties.pythonOutputRoot()).toAbsolutePath().normalize();
    }

    public String store(UUID sessionId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Uploaded image is empty");
        }

        Files.createDirectories(rootDir);

        String extension = extractExtension(file.getOriginalFilename());
        Path sessionDir = rootDir.resolve(sessionId.toString()).resolve(LocalDate.now().toString());
        Files.createDirectories(sessionDir);

        String filename = UUID.randomUUID() + extension;
        Path target = sessionDir.resolve(filename).normalize();

        if (!target.startsWith(rootDir)) {
            throw new IOException("Invalid upload path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return target.toString();
    }

    public String copyOcrArtifactsToStorage(String originalImagePath, String processedImagePath) throws IOException {
        if (!copyOcrArtifacts) {
            return processedImagePath;
        }
        if (originalImagePath == null || originalImagePath.isBlank()) {
            return processedImagePath;
        }

        Path sourceDir = resolvePythonOutputDir(originalImagePath);
        if (!Files.isDirectory(sourceDir)) {
            return processedImagePath;
        }

        Path originalPath = Path.of(originalImagePath).toAbsolutePath().normalize();
        Path originalParent = originalPath.getParent();
        if (originalParent == null) {
            return processedImagePath;
        }

        String baseName = stripExtension(originalPath.getFileName().toString());
        Path targetDir = originalParent.resolve(baseName).normalize();
        if (!targetDir.startsWith(rootDir)) {
            throw new IOException("Invalid OCR artifact target path");
        }

        deleteDirectoryIfExists(targetDir);
        copyDirectory(sourceDir, targetDir);

        Path alignedCopy = targetDir.resolve("aligned.png");
        if (Files.exists(alignedCopy)) {
            return alignedCopy.toString();
        }

        return processedImagePath;
    }

    public void deleteBlankArtifacts(String originalImagePath, String processedImagePath, String thumbnailPath) throws IOException {
        deleteFileIfExists(originalImagePath);
        deleteFileIfExists(processedImagePath);
        deleteFileIfExists(thumbnailPath);

        if (originalImagePath == null || originalImagePath.isBlank()) {
            return;
        }

        Path originalPath = Path.of(originalImagePath).toAbsolutePath().normalize();
        Path originalParent = originalPath.getParent();
        if (originalParent == null) {
            return;
        }

        Path artifactDir = originalParent.resolve(stripExtension(originalPath.getFileName().toString())).normalize();
        if (artifactDir.startsWith(rootDir) && Files.isDirectory(artifactDir)) {
            deleteDirectoryIfExists(artifactDir);
        }
    }

    private String extractExtension(String originalFilename) {
        String cleanName = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        int index = cleanName.lastIndexOf('.');
        if (index < 0) {
            return ".bin";
        }
        return cleanName.substring(index);
    }

    private Path resolvePythonOutputDir(String originalImagePath) {
        Path originalPath = Path.of(originalImagePath).toAbsolutePath().normalize();
        String baseName = stripExtension(originalPath.getFileName().toString());
        return pythonOutputRoot.resolve(baseName).normalize();
    }

    private String stripExtension(String filename) {
        int index = filename.lastIndexOf('.');
        if (index < 0) {
            return filename;
        }
        return filename.substring(0, index);
    }

    private void deleteDirectoryIfExists(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException exc) {
                            throw new RuntimeException(exc);
                        }
                    });
        } catch (RuntimeException exc) {
            if (exc.getCause() instanceof IOException ioException) {
                throw ioException;
            }
            throw exc;
        }
    }

    private void copyDirectory(Path sourceDir, Path targetDir) throws IOException {
        try (Stream<Path> walk = Files.walk(sourceDir)) {
            for (Path sourcePath : walk.toList()) {
                Path relativePath = sourceDir.relativize(sourcePath);
                Path targetPath = targetDir.resolve(relativePath).normalize();
                if (!targetPath.startsWith(targetDir)) {
                    throw new IOException("Invalid OCR artifact copy path");
                }
                if (Files.isDirectory(sourcePath)) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(targetPath.getParent());
                    Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }

    private void deleteFileIfExists(String pathValue) throws IOException {
        if (pathValue == null || pathValue.isBlank()) {
            return;
        }
        Path path = Path.of(pathValue).toAbsolutePath().normalize();
        if (Files.exists(path) && Files.isRegularFile(path)) {
            Files.delete(path);
        }
    }
}
