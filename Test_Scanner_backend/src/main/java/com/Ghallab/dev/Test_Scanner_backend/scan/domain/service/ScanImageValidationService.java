package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ScanImageValidationService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");

    public void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BadRequestException("Файл изображения обязателен");
        }

        String contentType = image.getContentType();
        if (contentType == null || ALLOWED_CONTENT_TYPES.stream().noneMatch(type -> type.equalsIgnoreCase(contentType))) {
            throw new BadRequestException("Можно загружать только изображения JPG, PNG или WEBP");
        }

        String originalFilename = image.getOriginalFilename();
        String normalizedFilename = originalFilename == null ? "" : originalFilename.toLowerCase(Locale.ROOT);
        boolean extensionAllowed = ALLOWED_EXTENSIONS.stream().anyMatch(normalizedFilename::endsWith);
        if (!extensionAllowed) {
            throw new BadRequestException("Недопустимое расширение файла. Разрешены JPG, PNG и WEBP");
        }

        try (InputStream inputStream = image.getInputStream()) {
            BufferedImage bufferedImage = ImageIO.read(inputStream);
            if (bufferedImage == null) {
                throw new BadRequestException("Загруженный файл не удалось распознать как изображение");
            }

            if (bufferedImage.getWidth() < 200 || bufferedImage.getHeight() < 200) {
                throw new BadRequestException("Изображение слишком маленькое для проверки бланка");
            }
        } catch (IOException exception) {
            throw new BadRequestException("Не удалось прочитать загруженное изображение");
        }
    }
}
