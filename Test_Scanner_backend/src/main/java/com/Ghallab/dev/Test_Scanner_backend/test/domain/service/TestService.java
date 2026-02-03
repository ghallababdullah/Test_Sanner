package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.*;

import java.util.List;
import java.util.UUID;

public interface TestService {
    // ЧТЕНИЕ
    Response<List<TestResponse>> getAllTests();
    Response<List<TestResponse>> getTestsByUser(UUID userId);
    Response<TestResponse> getTestById(UUID testId);
    Response<TestWithDetailsResponse> getTestWithDetails(UUID testId);

    // СОЗДАНИЕ
    Response<TestResponse> createTest(CreateTestRequest request, UUID userId);

    // ОБНОВЛЕНИЕ
    Response<TestResponse> updateTest(UUID testId, UpdateTestRequest request);

    // УДАЛЕНИЕ
    Response<String> deleteTest(UUID testId);

    // АКТИВАЦИЯ/ДЕАКТИВАЦИЯ
    Response<String> activateTest(UUID testId);
    Response<String> deactivateTest(UUID testId);







}
