package com.Ghallab.dev.Test_Scanner_backend.test.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.service.TestServiceImpl;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateTestRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.TestResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.TestWithDetailsResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateTestRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tests")
@Slf4j
@AllArgsConstructor
public class TestController {
    private final TestServiceImpl testService;

    /**
     * POST /api/tests/create-test
     * Создать новый тест
     *
     * @param request - данные для создания теста
     * @param authentication - информация о текущем пользователе
     * @return Response с созданным тестом
     */
    @PostMapping("/create-test")
    public ResponseEntity<Response<TestResponse>> createTest(
            @Valid @RequestBody CreateTestRequest request,
            Authentication authentication) {

        log.info("📝 Create Test endpoint called for user: {}", authentication.getName());

        // ✅ Получить EMAIL пользователя из authentication (это email, а не UUID!)
        String userEmail = authentication.getName();
        log.info("✅ User Email extracted: {}", userEmail);

        // ✅ Вызвать сервис с правильными параметрами
        Response<TestResponse> response = testService.createTest(request, userEmail);

        log.info("✅ Test created successfully by user: {}", userEmail);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/update-test/{testId}")
    public ResponseEntity<Response<TestResponse>> updateTest(
            @PathVariable UUID testId,
            @Valid @RequestBody UpdateTestRequest request) {

        log.info("✏️ Update Test endpoint called for test ID: {}", testId);

        // ✅ Вызвать сервис с параметрами
        Response<TestResponse> response = testService.updateTest(testId, request);

        log.info("✅ Test updated successfully: {}", testId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-test/{testId}")
    public ResponseEntity<Response<String>> deleteTest(
            @PathVariable UUID testId) {
        log.info("🗑️ Delete Test endpoint called for test ID: {}", testId);
        // ✅ Вызвать сервис с параметрами
        Response<String> response = testService.deleteTest(testId);
        log.info("✅ Test deleted successfully: {}", testId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{testId}")
    public ResponseEntity<Response<TestResponse>> getTestById(
            @PathVariable UUID testId) {

        log.info("🔍 Get Test endpoint called for test ID: {}", testId);

        Response<TestResponse> response = testService.getTestById(testId);

        log.info("✅ Test retrieved successfully: {}", testId);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tests/{testId}/details
     * Получить тест со всеми деталями (ответы и пороги оценок)
     */
    @GetMapping("/{testId}/details")
    public ResponseEntity<Response<TestWithDetailsResponse>> getTestWithDetails(
            @PathVariable UUID testId) {

        log.info("🔍 Get Test With Details endpoint called for test ID: {}", testId);

        Response<TestWithDetailsResponse> response = testService.getTestWithDetails(testId);

        log.info("✅ Test with details retrieved successfully: {}", testId);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tests
     * Получить все активные тесты ТЕКУЩЕГО пользователя
     */
    @GetMapping
    public ResponseEntity<Response<List<TestResponse>>> getAllTests(Authentication authentication) {

        log.info("🔍 Get All Tests endpoint called for user: {}", authentication.getName());

        String userEmail = authentication.getName();
        Response<List<TestResponse>> response = testService.getTestsByUser(userEmail);

        log.info("✅ All tests retrieved successfully for user: {}", userEmail);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tests/user/{userId}
     * Получить все тесты пользователя
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Response<List<TestResponse>>> getTestsByUser(
            Authentication authentication) {

        log.info("🔍 Get Tests By User endpoint called for user: {}", authentication.getName());

        String userEmail = authentication.getName();

        Response<List<TestResponse>> response = testService.getTestsByUser(userEmail);

        log.info("✅ Tests retrieved successfully for user: {}", userEmail);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/tests/{testId}/activate
     * Активировать тест
     */
    @PutMapping("/{testId}/activate")
    public ResponseEntity<Response<String>> activateTest(
            @PathVariable UUID testId) {

        log.info("✅ Activate Test endpoint called for test ID: {}", testId);

        Response<String> response = testService.activateTest(testId);

        log.info("✅ Test activated successfully: {}", testId);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/tests/{testId}/deactivate
     * Деактивировать тест
     */
    @PutMapping("/{testId}/deactivate")
    public ResponseEntity<Response<String>> deactivateTest(
            @PathVariable UUID testId) {

        log.info("❌ Deactivate Test endpoint called for test ID: {}", testId);

        Response<String> response = testService.deactivateTest(testId);

        log.info("✅ Test deactivated successfully: {}", testId);

        return ResponseEntity.ok(response);
    }
}
