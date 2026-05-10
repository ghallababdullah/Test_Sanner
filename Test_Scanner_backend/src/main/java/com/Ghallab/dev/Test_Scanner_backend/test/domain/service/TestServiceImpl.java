package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.AnswerKeyRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.GradeThresholdRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateTestRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.TestResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.TestWithDetailsResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateTestRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.mapper.TestMapper;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@Builder
@RequiredArgsConstructor
public class TestServiceImpl implements TestService {
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final GradeThresholdRepository gradeThresholdRepository;
    private final AnswerKeyRepository answerKeyRepository;
    private final TestMapper testMapper;

    @Override
    @Transactional
    public Response<TestResponse> createTest(CreateTestRequest request, String userEmail) {
        log.info("📝 Starting test creation for user: {}", userEmail);

        // ✅ Проверить, что пользователь существует по EMAIL
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.error("❌ User not found with email: {}", userEmail);
                    return new NotFoundException("User not found with email: " + userEmail);
                });

        log.info("✅ User found: {}", user.getEmail());

        // ✅ Преобразовать Request → Entity
        Test test = testMapper.toTestEntity(request, user);
        log.info("📋 Test entity created: {}", request.getTitle());

        // ✅ Сохранить тест в БД
        Test savedTest = testRepository.save(test);
        log.info("✅ Test saved with id: {}", savedTest.getId());

        // ✅ Создать дефолтные пороги оценок
        createDefaultGradeThresholds(savedTest);
        log.info("✅ Default grade thresholds created for test: {}", savedTest.getId());

        // ✅ Преобразовать Entity → Response DTO
        TestResponse response = testMapper.toTestResponse(savedTest);

        log.info("✅ Test created successfully: {} (ID: {})", savedTest.getTitle(), savedTest.getId());

        return Response.<TestResponse>builder()
                .success(true)
                .message("Test created successfully")
                .data(response)
                .build();
    }

    /**
     * Создает дефолтные пороги оценок для нового теста
     * Пороги: 91-100% = 5, 71-90% = 4, 51-70% = 3, 0-50% = 2
     */
    private void createDefaultGradeThresholds(Test test) {
        log.debug("🔧 Creating default grade thresholds for test: {}", test.getId());

        // Оценка 5 (отлично)
        GradeThreshold grade5 = GradeThreshold.builder()
                .test(test)
                .gradeName("Отлично")
                .gradeSymbol("5")
                .minPercentage(90)
                .maxPercentage(100)
                .build();

        // Оценка 4 (хорошо)
        GradeThreshold grade4 = GradeThreshold.builder()
                .test(test)
                .gradeName("Хорошо")
                .gradeSymbol("4")
                .minPercentage(70)
                .maxPercentage(89)
                .build();

        // Оценка 3 (удовлетворительно)
        GradeThreshold grade3 = GradeThreshold.builder()
                .test(test)
                .gradeName("Удовлетворительно")
                .gradeSymbol("3")
                .minPercentage(50)
                .maxPercentage(69)
                .build();

        // Оценка 2 (неудовлетворительно)
        GradeThreshold grade2 = GradeThreshold.builder()
                .test(test)
                .gradeName("Неудовлетворительно")
                .gradeSymbol("2")
                .minPercentage(0)
                .maxPercentage(50)
                .build();

        // ✅ Сохранить все пороги
        gradeThresholdRepository.saveAll(List.of(grade5, grade4, grade3, grade2));
        log.debug("✅ All 4 default grade thresholds created");
    }


    @Override
    @Transactional
    public Response<TestResponse> updateTest(UUID testId, UpdateTestRequest request) {
        log.info("✏️ Starting test update for test ID: {}", testId);

        // ✅ Найти существующий тест
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        Integer previousTotalQuestions = test.getTotalQuestions();
        Integer nextTotalQuestions = request.getTotalQuestions();
        if (nextTotalQuestions != null && (nextTotalQuestions < 1 || nextTotalQuestions > 32)) {
            throw new BadRequestException("Total questions must be between 1 and 32");
        }

        // ✅ Обновить поля из Request (только не-null значения)
        testMapper.updateTestFromRequest(request, test);
        log.info("📝 Test fields updated");

        if (nextTotalQuestions != null && nextTotalQuestions < previousTotalQuestions) {
            answerKeyRepository.deleteByTestIdAndQuestionNumberGreaterThan(testId, nextTotalQuestions);
            log.info("✅ Deleted answer keys above question {}", nextTotalQuestions);
        }

        // ✅ Сохранить обновленный тест в БД
        Test updatedTest = testRepository.save(test);
        log.info("✅ Test saved with id: {}", updatedTest.getId());

        // ✅ Преобразовать Entity → Response DTO
        TestResponse response = testMapper.toTestResponse(updatedTest);

        log.info("✅ Test updated successfully: {} (ID: {})", updatedTest.getTitle(), updatedTest.getId());

        return Response.<TestResponse>builder()
                .success(true)
                .message("Test updated successfully")
                .data(response)
                .build();
    }


    @Override
    public Response<String> deleteTest(UUID testId) {
        log.info("✏️ Starting delete update for test ID: {}", testId);
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });
        testRepository.delete(test);
        log.info("✅ Test deleted successfully: {} (ID: {})", test.getTitle(), test.getId());
        return Response.<String>builder()
                .success(true)
                .message("Test deleted successfully")
                .statusCode(HttpStatus.OK.value())
                .data("Test with ID " + testId + " has been deleted.")
                .build();
    }




    @Override
    public Response<List<TestResponse>> getTestsByUser(String userEmail) {
        log.info("🔍 Retrieving all tests for user {}", userEmail);

        // ✅ Найти пользователя по email
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.error("❌ User not found with email: {}", userEmail);
                    return new NotFoundException("User not found with email: " + userEmail);
                });

        // ✅ Получить все тесты этого пользователя по его ID
        List<Test> tests = testRepository.findByCreatorId(user.getId());
        log.info("✅ Found {} tests in database", tests.size());

        // ✅ Преобразовать List<Test> → List<TestResponse> через Mapper
        List<TestResponse> responses = testMapper.toTestResponseList(tests);
        log.info("✅ Converted {} tests to responses", responses.size());

        return Response.<List<TestResponse>>builder()
                .success(true)
                .message("All tests retrieved successfully")
                .data(responses)
                .build();
    }

    @Override
    public Response<TestResponse> getTestById(UUID testId) {
        log.info("🔍 Retrieving test by ID: {}", testId);

        // ✅ Найти тест по ID
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Преобразовать Entity → Response DTO
        TestResponse response = testMapper.toTestResponse(test);
        log.info("✅ Test converted to response: {} (ID: {})", response.getTitle(), response.getId());

        return Response.<TestResponse>builder()
                .success(true)
                .message("Test retrieved successfully")
                .statusCode(HttpStatus.OK.value())
                .data(response)
                .build();
    }
    @Override
    @Transactional
    public Response<String> activateTest(UUID testId) {
        log.info("🔍 Activating test by ID: {}", testId);

        // ✅ Найти тест по ID
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Установить isActive = true
        test.setIsActive(true);
        log.info("📝 Test isActive set to true");

        // ✅ СОХРАНИТЬ в БД
        Test activatedTest = testRepository.save(test);
        log.info("✅ Test activated successfully: {} (ID: {})", activatedTest.getTitle(), activatedTest.getId());

        return Response.<String>builder()
                .success(true)
                .message("Test activated successfully")
                .statusCode(HttpStatus.OK.value())
                .data("Test with ID " + testId + " has been activated.")
                .build();
    }
    @Override
    @Transactional
    public Response<String> deactivateTest(UUID testId) {
        log.info("🔍 Deactivating test by ID: {}", testId);

        // ✅ Найти тест по ID
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Установить isActive = false
        test.setIsActive(false);
        log.info("📝 Test isActive set to false");

        // ✅ СОХРАНИТЬ в БД
        Test deactivatedTest = testRepository.save(test);
        log.info("✅ Test deactivated successfully: {} (ID: {})", deactivatedTest.getTitle(), deactivatedTest.getId());

        return Response.<String>builder()
                .success(true)
                .message("Test deactivated successfully")
                .statusCode(HttpStatus.OK.value())
                .data("Test with ID " + testId + " has been deactivated.")
                .build();
    }

    @Override
    public Response<TestWithDetailsResponse> getTestWithDetails(UUID testId) {
        log.info("🔍 Retrieving test with details by ID: {}", testId);

        // ✅ Найти тест по ID
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Получить все ключи ответов для этого теста
        log.info("📋 Fetching answer keys for test");
        List<AnswerKey> answerKeys = answerKeyRepository.findByTestIdOrderByQuestionNumber(testId);
        log.info("✅ Found {} answer keys", answerKeys.size());

        // ✅ Получить все пороги оценок для этого теста
        log.info("📋 Fetching grade thresholds for test");
        List<GradeThreshold> gradeThresholds = gradeThresholdRepository.findByTestIdOrderByMinPercentageAsc(testId);
        log.info("✅ Found {} grade thresholds", gradeThresholds.size());

        // ✅ Преобразовать Entity → Response DTO с деталями
        log.info("📝 Mapping test with details to response");
        TestWithDetailsResponse response = testMapper.toTestWithDetailsResponse(test, answerKeys, gradeThresholds);

        log.info("✅ Test with details retrieved successfully: {} (ID: {})", test.getTitle(), test.getId());

        return Response.<TestWithDetailsResponse>builder()
                .success(true)
                .message("Test with details retrieved successfully")
                .statusCode(HttpStatus.OK.value())
                .data(response)
                .build();
    }

}
