package com.Ghallab.dev.Test_Scanner_backend.test.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.service.GradeThresholdServiceImpl;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateGradeThresholdRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.GradeThresholdResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateGradeThresholdRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tests/{testId}/grade-thresholds")
@Slf4j
@AllArgsConstructor
public class GradeThresholdController {
    private final GradeThresholdServiceImpl gradeThresholdService;

    /**
     * POST /api/tests/{testId}/grade-thresholds
     * Создать новые пороги оценок для теста (СПИСОК)
     * Удаляет старые пороги и создает новые
     *
     * @param testId - ID теста
     * @param requests - данные для создания порогов (массив)
     * @return Response со списком созданных порогов
     */
    @PostMapping
    public ResponseEntity<Response<List<GradeThresholdResponse>>> createGradeThresholds(
            @PathVariable UUID testId,
            @Valid @RequestBody List<CreateGradeThresholdRequest> requests) {

        log.info("📝 Create Grade Thresholds endpoint called for test ID: {}", testId);

        // Установить testId для всех requests
        requests.forEach(req -> req.setTestId(testId));

        Response<List<GradeThresholdResponse>> response = gradeThresholdService.createGradeThresholds(testId, requests);

        log.info("✅ Grade thresholds created successfully, count: {}", requests.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/tests/{testId}/grade-thresholds/single
     * Создать ОДИН порог оценки для теста
     * Не удаляет существующие пороги, просто добавляет новый
     *
     * @param testId - ID теста
     * @param request - данные для создания одного порога
     * @return Response с созданным порогом
     */
    @PostMapping("/single")
    public ResponseEntity<Response<GradeThresholdResponse>> createGradeThreshold(
            @PathVariable UUID testId,
            @Valid @RequestBody CreateGradeThresholdRequest request) {

        log.info("📝 Create Single Grade Threshold endpoint called for test ID: {}", testId);

        // Установить testId в request
        request.setTestId(testId);

        Response<GradeThresholdResponse> response = gradeThresholdService.createGradeThreshold(request);

        log.info("✅ Grade threshold created successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/tests/{testId}/grade-thresholds
     * Получить все пороги оценок для теста
     *
     * @param testId - ID теста
     * @return Response со списком порогов
     */
    @GetMapping
    public ResponseEntity<Response<List<GradeThresholdResponse>>> getGradeThresholdsByTest(
            @PathVariable UUID testId) {

        log.info("🔍 Get Grade Thresholds endpoint called for test ID: {}", testId);

        Response<List<GradeThresholdResponse>> response = gradeThresholdService.getGradeThresholdsByTest(testId);

        log.info("✅ Grade thresholds retrieved successfully for test: {}", testId);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/tests/{testId}/grade-thresholds/{thresholdId}
     * Обновить порог оценки
     *
     * @param thresholdId - ID порога для обновления
     * @param request - новые данные порога
     * @return Response с обновленным порогом
     */
    @PutMapping("/{thresholdId}")
    public ResponseEntity<Response<GradeThresholdResponse>> updateGradeThreshold(
            @PathVariable UUID testId,
            @PathVariable UUID thresholdId,
            @Valid @RequestBody UpdateGradeThresholdRequest request) {

        log.info("✏️ Update Grade Threshold endpoint called for threshold ID: {}", thresholdId);

        Response<GradeThresholdResponse> response = gradeThresholdService.updateGradeThreshold(thresholdId, request);

        log.info("✅ Grade threshold updated successfully: {}", thresholdId);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/tests/{testId}/grade-thresholds/{thresholdId}
     * Удалить порог оценки
     *
     * @param thresholdId - ID порога для удаления
     * @return Response с сообщением об удалении
     */
    @DeleteMapping("/{thresholdId}")
    public ResponseEntity<Response<String>> deleteGradeThreshold(
            @PathVariable UUID testId,
            @PathVariable UUID thresholdId) {

        log.info("🗑️ Delete Grade Threshold endpoint called for threshold ID: {}", thresholdId);

        Response<String> response = gradeThresholdService.deleteGradeThreshold(thresholdId);

        log.info("✅ Grade threshold deleted successfully: {}", thresholdId);

        return ResponseEntity.ok(response);
    }
}

