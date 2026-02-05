package com.Ghallab.dev.Test_Scanner_backend.test.mapper;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.*;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * TestMapper - преобразует между Test, AnswerKey, GradeThreshold Entities и различными DTOs
 * Используется для преобразования данных тестов для API
 */
@Component
public class TestMapper {

    private final ModelMapper modelMapper;


    public TestMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    // ==================== TEST MAPPER ====================

    /**
     * Преобразует Test Entity в TestResponse DTO
     * Используется при возврате одного теста в API
     */
    public TestResponse toTestResponse(Test test) {
        TestResponse response = modelMapper.map(test, TestResponse.class);

        if (test.getCreator() != null) {
            response.setCreatorId(test.getCreator().getId());
            response.setCreatorEmail(test.getCreator().getEmail());
        }
        return response;
    }

    /**
     * Преобразует CreateTestRequest DTO в Test Entity
     * ВАЖНО: Используется в TestServiceImpl.createTest()
     */
    public Test toTestEntity(CreateTestRequest request, User creator) {
        Test test = modelMapper.map(request, Test.class);
        test.setCreator(creator);
        test.setIsActive(true);
        return test;
    }

    /**
     * Обновляет Test Entity из UpdateTestRequest DTO
     */
    public void updateTestFromRequest(UpdateTestRequest request, Test test) {
        if (request.getTitle() != null) {
            test.setTitle(request.getTitle());
        }
        if (request.getSubject() != null) {
            test.setSubject(request.getSubject());
        }
        if (request.getDescription() != null) {
            test.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            test.setIsActive(request.getIsActive());
        }
    }

    /**
     * Преобразует Test Entity в TestWithDetailsResponse DTO
     * Включает все детали: ответы и пороги оценок
     */
    public TestWithDetailsResponse toTestWithDetailsResponse(
            Test test,
            List<AnswerKey> answerKeys,
            List<GradeThreshold> gradeThresholds) {
        TestWithDetailsResponse response = modelMapper.map(test, TestWithDetailsResponse.class);
        if (test.getCreator() != null) {
            response.setCreatorId(test.getCreator().getId());
        }
        response.setAnswerKeys(answerKeys.stream()
                .map(this::toAnswerKeyResponse)
                .collect(Collectors.toList()));
        response.setGradeThresholds(gradeThresholds.stream()
                .map(this::toGradeThresholdResponse)
                .collect(Collectors.toList()));
        return response;
    }

    // ==================== ANSWER KEY MAPPER ====================

    /**
     * Преобразует AnswerKey Entity в AnswerKeyResponse DTO
     * Используется при возврате ключей ответов в API
     */
    public AnswerKeyResponse toAnswerKeyResponse(AnswerKey answerKey) {
        AnswerKeyResponse response = modelMapper.map(answerKey, AnswerKeyResponse.class);
        if (answerKey.getTest() != null) {
            response.setTestId(answerKey.getTest().getId());
        }
        return response;
    }

    /**
     * Преобразует CreateAnswerKeyRequest DTO в AnswerKey Entity
     * ВАЖНО: Используется в AnswerKeyServiceImpl.createAnswerKey()
     * Передаём Test объект для правильного связывания
     */
    public AnswerKey toAnswerKeyEntity(CreateAnswerKeyRequest request, Test test) {
        AnswerKey answerKey = modelMapper.map(request, AnswerKey.class);
        answerKey.setTest(test);

//        // ✅ Явно установить версию (ModelMapper её пропускает)
//        answerKey.setVersion(0L);
//
//        // ✅ Явно установить createdAt (будет переопределен @CreatedDate, но для безопасности)
//        answerKey.setCreatedAt(java.time.LocalDateTime.now());

        // Установить дефолтные значения если не указаны
        if (answerKey.getMaxPoints() == null) {
            answerKey.setMaxPoints(java.math.BigDecimal.ONE);
        }
        if (answerKey.getToleranceLevel() == null) {
            answerKey.setToleranceLevel(1);
        }
        if (answerKey.getAnswerType() == null) {
            answerKey.setAnswerType(AnswerKey.AnswerType.TEXT);
        }

        return answerKey;
    }

    /**
     * Обновляет AnswerKey Entity из UpdateAnswerKeyRequest DTO
     */
    public void updateAnswerKeyFromRequest(UpdateAnswerKeyRequest request, AnswerKey answerKey) {
        if (request.getCorrectAnswer() != null) {
            answerKey.setCorrectAnswer(request.getCorrectAnswer());
        }
        if (request.getMaxPoints() != null) {
            answerKey.setMaxPoints(request.getMaxPoints());
        }
        if (request.getToleranceLevel() != null) {
            answerKey.setToleranceLevel(request.getToleranceLevel());
        }
    }

    // ==================== GRADE THRESHOLD MAPPER ====================

    /**
     * Преобразует GradeThreshold Entity в GradeThresholdResponse DTO
     * Используется при возврате порогов оценок в API
     */
    public GradeThresholdResponse toGradeThresholdResponse(GradeThreshold gradeThreshold) {
        GradeThresholdResponse response = modelMapper.map(gradeThreshold, GradeThresholdResponse.class);
        if (gradeThreshold.getTest() != null) {
            response.setTestId(gradeThreshold.getTest().getId());
        }
        return response;
    }

    /**
     * Преобразует CreateGradeThresholdRequest DTO в GradeThreshold Entity
     * ВАЖНО: Используется в GradeThresholdServiceImpl.createGradeThreshold()
     */
    public GradeThreshold toGradeThresholdEntity(CreateGradeThresholdRequest request, Test test) {
        GradeThreshold gradeThreshold = modelMapper.map(request, GradeThreshold.class);
        gradeThreshold.setTest(test);
        return gradeThreshold;
    }

    /**
     * Обновляет GradeThreshold Entity из UpdateGradeThresholdRequest DTO
     */
    public void updateGradeThresholdFromRequest(UpdateGradeThresholdRequest request, GradeThreshold gradeThreshold) {
        if (request.getMinPercentage() != null) {
            gradeThreshold.setMinPercentage(request.getMinPercentage());
        }
        if (request.getMaxPercentage() != null) {
            gradeThreshold.setMaxPercentage(request.getMaxPercentage());
        }
    }

    /**
     * Преобразует список GradeThreshold в список GradeThresholdResponse
     */
    public List<GradeThresholdResponse> toGradeThresholdResponseList(List<GradeThreshold> gradeThresholds) {
        return gradeThresholds.stream()
                .map(this::toGradeThresholdResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список AnswerKey в список AnswerKeyResponse
     */
    public List<AnswerKeyResponse> toAnswerKeyResponseList(List<AnswerKey> answerKeys) {
        return answerKeys.stream()
                .map(this::toAnswerKeyResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Test в список TestResponse
     */
    public List<TestResponse> toTestResponseList(List<Test> tests) {
        return tests.stream()
                .map(this::toTestResponse)
                .collect(Collectors.toList());
    }
}
