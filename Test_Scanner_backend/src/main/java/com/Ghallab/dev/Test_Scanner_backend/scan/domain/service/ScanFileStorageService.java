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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;

@Service
public class ScanFileStorageService {
    private static final String ROI_OVERRIDES_FILENAME = "roi_overrides.json";
    private static final String OCR_RESULT_FILENAME = "ocr_result.json";
    private static final String ALIGNED_FILENAME = "aligned.png";
    private static final String ANNOTATED_RELATIVE_DIR = "detect_crops";
    private static final String ANNOTATED_FILENAME = "_annotated.png";

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
        Files.createDirectories(targetDir);
        copyArtifactIfExists(sourceDir, targetDir, ALIGNED_FILENAME);
        copyArtifactIfExists(sourceDir, targetDir, OCR_RESULT_FILENAME);
        copyArtifactIfExists(sourceDir, targetDir, ROI_OVERRIDES_FILENAME);
        copyArtifactIfExists(sourceDir, targetDir, ANNOTATED_RELATIVE_DIR, ANNOTATED_FILENAME);

        Path alignedCopy = targetDir.resolve(ALIGNED_FILENAME);
        if (Files.exists(alignedCopy)) {
            deleteDirectoryIfExists(sourceDir);
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

    public Path resolveBlankAssetPath(ScannedBlank blank, String kind) {
        if (blank == null || kind == null || kind.isBlank()) {
            return null;
        }

        return switch (kind.toLowerCase()) {
            case "original" -> normalizeIfExists(blank.getOriginalImagePath());
            case "processed" -> {
                Path processed = normalizeIfExists(blank.getProcessedImagePath());
                if (processed != null) {
                    yield processed;
                }
                Path storageAligned = resolveArtifactPath(blank.getOriginalImagePath(), ALIGNED_FILENAME);
                if (storageAligned != null) {
                    yield storageAligned;
                }
                yield resolvePythonArtifactPath(blank, ALIGNED_FILENAME);
            }
            case "annotated" -> {
                Path storageAnnotated = resolveArtifactPath(blank.getOriginalImagePath(), ANNOTATED_RELATIVE_DIR, ANNOTATED_FILENAME);
                if (storageAnnotated != null) {
                    yield storageAnnotated;
                }
                yield resolvePythonArtifactPath(blank, ANNOTATED_RELATIVE_DIR, ANNOTATED_FILENAME);
            }
            case "thumbnail" -> normalizeIfExists(blank.getThumbnailPath());
            default -> null;
        };
    }

    public List<Path> listBlankMetaFiles(ScannedBlank blank) throws IOException {
        Path artifactDir = resolveArtifactDirectory(blank != null ? blank.getOriginalImagePath() : null);
        List<Path> storageFiles = listMetaFilesFromDir(artifactDir);
        if (!storageFiles.isEmpty()) {
            return storageFiles;
        }

        return listMetaFilesFromDir(resolvePythonOutputDir(blank != null ? blank.getOriginalImagePath() : null));
    }

    public Path resolveBlankRoiOverridesPath(ScannedBlank blank) {
        Path artifactDir = resolveArtifactDirectory(blank != null ? blank.getOriginalImagePath() : null);
        if (artifactDir == null) {
            return null;
        }
        return artifactDir.resolve(ROI_OVERRIDES_FILENAME).normalize();
    }

    public Path resolvePythonOutputRoiOverridesPath(ScannedBlank blank) {
        if (blank == null || blank.getOriginalImagePath() == null || blank.getOriginalImagePath().isBlank()) {
            return null;
        }

        Path originalPath = Path.of(blank.getOriginalImagePath()).toAbsolutePath().normalize();
        String baseName = stripExtension(originalPath.getFileName().toString());
        return pythonOutputRoot.resolve(baseName).resolve(ROI_OVERRIDES_FILENAME).normalize();
    }

    public void writeRoiOverrides(ScannedBlank blank, String jsonContent) throws IOException {
        writeString(resolveBlankRoiOverridesPath(blank), jsonContent);
        writeString(resolvePythonOutputRoiOverridesPath(blank), jsonContent);
    }

    public String readRoiOverrides(ScannedBlank blank) throws IOException {
        Path storagePath = resolveBlankRoiOverridesPath(blank);
        if (storagePath != null && Files.exists(storagePath) && Files.isRegularFile(storagePath)) {
            return Files.readString(storagePath);
        }

        Path pythonPath = resolvePythonOutputRoiOverridesPath(blank);
        if (pythonPath != null && Files.exists(pythonPath) && Files.isRegularFile(pythonPath)) {
            return Files.readString(pythonPath);
        }

        return null;
    }

    public String readOcrResultJson(ScannedBlank blank) throws IOException {
        Path storagePath = resolveArtifactPath(blank != null ? blank.getOriginalImagePath() : null, OCR_RESULT_FILENAME);
        if (storagePath != null && Files.exists(storagePath) && Files.isRegularFile(storagePath)) {
            return Files.readString(storagePath);
        }

        Path pythonPath = resolvePythonOcrResultPath(blank);
        if (pythonPath != null && Files.exists(pythonPath) && Files.isRegularFile(pythonPath)) {
            return Files.readString(pythonPath);
        }

        return null;
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
        if (originalImagePath == null || originalImagePath.isBlank()) {
            return null;
        }
        Path originalPath = Path.of(originalImagePath).toAbsolutePath().normalize();
        String baseName = stripExtension(originalPath.getFileName().toString());
        return pythonOutputRoot.resolve(baseName).normalize();
    }

    private Path resolvePythonOcrResultPath(ScannedBlank blank) {
        if (blank == null || blank.getOriginalImagePath() == null || blank.getOriginalImagePath().isBlank()) {
            return null;
        }
        return resolvePythonOutputDir(blank.getOriginalImagePath()).resolve(OCR_RESULT_FILENAME).normalize();
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

    private void copyArtifactIfExists(Path sourceDir, Path targetDir, String... relativeParts) throws IOException {
        Path sourcePath = sourceDir;
        Path targetPath = targetDir;
        for (String part : relativeParts) {
            sourcePath = sourcePath.resolve(part);
            targetPath = targetPath.resolve(part);
        }

        sourcePath = sourcePath.normalize();
        targetPath = targetPath.normalize();

        if (!sourcePath.startsWith(sourceDir) || !targetPath.startsWith(targetDir)) {
            throw new IOException("Invalid OCR artifact copy path");
        }
        if (!Files.exists(sourcePath) || !Files.isRegularFile(sourcePath)) {
            return;
        }

        Files.createDirectories(targetPath.getParent());
        Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
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

    private void writeString(Path path, String content) throws IOException {
        if (path == null) {
            return;
        }
        Files.createDirectories(path.getParent());
        Files.writeString(path, content);
    }

    private Path normalizeIfExists(String pathValue) {
        if (pathValue == null || pathValue.isBlank()) {
            return null;
        }

        Path path = Path.of(pathValue).toAbsolutePath().normalize();
        return Files.exists(path) && Files.isRegularFile(path) ? path : null;
    }

    private Path resolveArtifactPath(String originalImagePath, String... relativeParts) {
        Path artifactDir = resolveArtifactDirectory(originalImagePath);
        if (artifactDir == null) {
            return null;
        }

        Path candidate = artifactDir;
        for (String part : relativeParts) {
            candidate = candidate.resolve(part);
        }
        candidate = candidate.normalize();

        return Files.exists(candidate) && Files.isRegularFile(candidate) ? candidate : null;
    }

    private Path resolvePythonArtifactPath(ScannedBlank blank, String... relativeParts) {
        if (blank == null) {
            return null;
        }

        Path artifactDir = resolvePythonOutputDir(blank.getOriginalImagePath());
        if (artifactDir == null) {
            return null;
        }

        Path candidate = artifactDir;
        for (String part : relativeParts) {
            candidate = candidate.resolve(part);
        }
        candidate = candidate.normalize();
        return Files.exists(candidate) && Files.isRegularFile(candidate) ? candidate : null;
    }

    private List<Path> listMetaFilesFromDir(Path artifactDir) throws IOException {
        if (artifactDir == null || !Files.isDirectory(artifactDir)) {
            return List.of();
        }

        List<Path> results = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(artifactDir, 1)) {
            walk.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".meta.json"))
                    .sorted()
                    .forEach(results::add);
        }
        return results;
    }

    private Path resolveArtifactDirectory(String originalImagePath) {
        if (originalImagePath == null || originalImagePath.isBlank()) {
            return null;
        }

        Path originalPath = Path.of(originalImagePath).toAbsolutePath().normalize();
        Path originalParent = originalPath.getParent();
        if (originalParent == null) {
            return null;
        }

        Path artifactDir = originalParent.resolve(stripExtension(originalPath.getFileName().toString())).normalize();
        if (!artifactDir.startsWith(rootDir)) {
            return null;
        }
        return artifactDir;
    }
}
