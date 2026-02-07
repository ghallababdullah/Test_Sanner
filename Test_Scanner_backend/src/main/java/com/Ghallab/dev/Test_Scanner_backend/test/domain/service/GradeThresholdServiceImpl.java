package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.GradeThresholdRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateGradeThresholdRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.GradeThresholdResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateGradeThresholdRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.mapper.TestMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@AllArgsConstructor
@Builder
public class GradeThresholdServiceImpl implements GradeThresholdService {
    private final TestMapper testMapper;
    private final TestRepository testRepository;
    private final GradeThresholdRepository gradeThresholdRepository;

    @Override
    @Transactional
    public Response<GradeThresholdResponse> createGradeThreshold(CreateGradeThresholdRequest request) {
        log.info("🔍 Checking if test exists with id: {}", request.getTestId());

        // ✅ Проверить что тест существует
        Test test = testRepository.findById(request.getTestId())
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", request.getTestId());
                    return new NotFoundException("Test not found with id: " + request.getTestId());
                });

        log.info("✅ Test found: {}", test.getTitle());

        log.info("📝 Mapping CreateGradeThresholdRequest to GradeThreshold entity");
        GradeThreshold gradeThreshold = testMapper.toGradeThresholdEntity(request, test);

        log.info("💾 Saving GradeThreshold to DB");
        GradeThreshold savedThreshold = gradeThresholdRepository.save(gradeThreshold);
        log.info("✅ GradeThreshold saved with id: {}", savedThreshold.getId());

        log.info("📋 Mapping saved GradeThreshold entity to GradeThresholdResponse DTO");
        GradeThresholdResponse response = testMapper.toGradeThresholdResponse(savedThreshold);

        return Response.<GradeThresholdResponse>builder()
                .success(true)
                .message("Grade threshold created successfully")
                .statusCode(HttpStatus.CREATED.value())
                .data(response)
                .build();
    }

    /**
     * Create multiple grade thresholds at once (e.g., all 4 grades for a test)
     * Удаляет старые пороги и создает новые
     */
    @Override
    @Transactional
    public Response<List<GradeThresholdResponse>> createGradeThresholds(UUID testId, List<CreateGradeThresholdRequest> requests) {
        log.info("🔍 Checking if test exists with id: {}", testId);

        // ✅ Проверить что тест существует
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Удалить старые пороги для этого теста (заменяем их)
        List<GradeThreshold> existingThresholds = gradeThresholdRepository.findByTestIdOrderByMinPercentageAsc(testId);
        if (!existingThresholds.isEmpty()) {
            log.info("🗑️ Deleting {} existing grade thresholds for test", existingThresholds.size());
            gradeThresholdRepository.deleteAll(existingThresholds);
        }

        // ✅ Создать новые пороги
        List<GradeThreshold> savedThresholds = new java.util.ArrayList<>();

        for (CreateGradeThresholdRequest request : requests) {
            log.info("📝 Creating grade threshold: {} ({}%)", request.getGradeSymbol(), request.getMinPercentage());

            GradeThreshold gradeThreshold = testMapper.toGradeThresholdEntity(request, test);
            GradeThreshold savedThreshold = gradeThresholdRepository.save(gradeThreshold);
            savedThresholds.add(savedThreshold);

            log.info("✅ Grade threshold saved with id: {}", savedThreshold.getId());
        }

        // ✅ Преобразовать в Response DTOs
        List<GradeThresholdResponse> responseList = testMapper.toGradeThresholdResponseList(savedThresholds);

        log.info("✅ All {} grade thresholds created successfully", responseList.size());

        return Response.<List<GradeThresholdResponse>>builder()
                .success(true)
                .message("Grade thresholds created successfully")
                .statusCode(HttpStatus.CREATED.value())
                .data(responseList)
                .build();
    }

    @Override
    public Response<List<GradeThresholdResponse>> getGradeThresholdsByTest(UUID testId) {
        log.info("🔍 Fetching grade thresholds for test with id: {}", testId);

        // ✅ Проверить что тест существует
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Получить все пороги оценок для этого теста
        log.info("📋 Fetching grade thresholds from repository");
        List<GradeThreshold> gradeThresholds = gradeThresholdRepository.findByTestIdOrderByMinPercentageAsc(testId);
        log.info("✅ Found {} grade thresholds", gradeThresholds.size());

        // ✅ Преобразовать в Response DTO
        List<GradeThresholdResponse> responseList = testMapper.toGradeThresholdResponseList(gradeThresholds);

        log.info("✅ Converted to {} response DTOs", responseList.size());

        return Response.<List<GradeThresholdResponse>>builder()
                .success(true)
                .message("Grade thresholds retrieved successfully")
                .statusCode(HttpStatus.OK.value())
                .data(responseList)
                .build();
    }

    @Override
    @Transactional
    public Response<GradeThresholdResponse> updateGradeThreshold(UUID thresholdId, UpdateGradeThresholdRequest request) {
        log.info("✏️ Starting grade threshold update for threshold ID: {}", thresholdId);

        // ✅ Найти существующий порог
        GradeThreshold gradeThreshold = gradeThresholdRepository.findById(thresholdId)
                .orElseThrow(() -> {
                    log.error("❌ Grade threshold not found with id: {}", thresholdId);
                    return new NotFoundException("Grade threshold not found with id: " + thresholdId);
                });

        log.info("✅ Grade threshold found: {}", gradeThreshold.getGradeName());

        // ✅ Обновить поля из Request (только не-null значения)
        testMapper.updateGradeThresholdFromRequest(request, gradeThreshold);
        log.info("📝 Grade threshold fields updated");

        // ✅ Сохранить обновленный порог в БД
        GradeThreshold updatedThreshold = gradeThresholdRepository.save(gradeThreshold);
        log.info("✅ Grade threshold saved with id: {}", updatedThreshold.getId());

        // ✅ Преобразовать Entity → Response DTO
        GradeThresholdResponse response = testMapper.toGradeThresholdResponse(updatedThreshold);

        log.info("✅ Grade threshold updated successfully: {}", updatedThreshold.getGradeName());

        return Response.<GradeThresholdResponse>builder()
                .success(true)
                .message("Grade threshold updated successfully")
                .statusCode(HttpStatus.OK.value())
                .data(response)
                .build();
    }

    @Override
    @Transactional
    public Response<String> deleteGradeThreshold(UUID thresholdId) {
        log.info("🔍 Starting grade threshold deletion for threshold ID: {}", thresholdId);

        // ✅ Найти порог оценки
        GradeThreshold gradeThreshold = gradeThresholdRepository.findById(thresholdId)
                .orElseThrow(() -> {
                    log.error("❌ Grade threshold not found with id: {}", thresholdId);
                    return new NotFoundException("Grade threshold not found with id: " + thresholdId);
                });

        log.info("✅ Grade threshold found: {}", gradeThreshold.getGradeName());

        // ✅ Удалить из БД
        gradeThresholdRepository.delete(gradeThreshold);
        log.info("✅ Grade threshold deleted successfully: {} (ID: {})", gradeThreshold.getGradeName(), gradeThreshold.getId());

        return Response.<String>builder()
                .success(true)
                .message("Grade threshold deleted successfully")
                .statusCode(HttpStatus.OK.value())
                .data("Grade threshold with ID " + thresholdId + " has been deleted.")
                .build();
    }
}
