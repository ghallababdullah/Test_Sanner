package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.AnswerKeyRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.AnswerKeyResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateAnswerKeyRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateAnswerKeyRequest;
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
public class AnswerKeyImpl implements AnswerkeyService {
    private final TestMapper testMapper;
    private final TestRepository testRepository;
    private final AnswerKeyRepository answerKeyRepository;

    @Override
    @Transactional
    public Response<AnswerKeyResponse> createAnswerKey(CreateAnswerKeyRequest request) {
        log.info("🔍 Checking if test exists with id: {}", request.getTestId());

        Test test = testRepository.findById(request.getTestId())
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", request.getTestId());
                    return new NotFoundException("Test not found with id: " + request.getTestId());
                });

        log.info("✅ Test found: {}", test.getTitle());

        log.info("📝 Mapping CreateAnswerKeyRequest to AnswerKey entity");
        AnswerKey answerKey = testMapper.toAnswerKeyEntity(request, test);

        log.info("💾 Saving AnswerKey to DB");
        AnswerKey savedKey = answerKeyRepository.save(answerKey);
        log.info("✅ AnswerKey saved with id: {}", savedKey.getId());

        log.info("📋 Mapping saved AnswerKey entity to AnswerKeyResponse DTO");
        AnswerKeyResponse response = testMapper.toAnswerKeyResponse(savedKey);

        return Response.<AnswerKeyResponse>builder()
                .success(true)
                .message("Answer key created successfully")
                .statusCode(HttpStatus.CREATED.value())
                .data(response)
                .build();
    }


    @Override
    public Response<List<AnswerKeyResponse>> getAnswerKeysByTest(UUID testId) {
        log.info("🔍 Fetching answer keys for test with id: {}", testId);

        // ✅ Проверить что тест существует
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> {
                    log.error("❌ Test not found with id: {}", testId);
                    return new NotFoundException("Test not found with id: " + testId);
                });

        log.info("✅ Test found: {}", test.getTitle());

        // ✅ Получить все ключи ответов для этого теста
        log.info("📋 Fetching answer keys from repository");
        List<AnswerKey> answerKeys = answerKeyRepository.findByTestIdOrderByQuestionNumber(testId);
        log.info("✅ Found {} answer keys", answerKeys.size());

        // ✅ Преобразовать в Response DTO
        List<AnswerKeyResponse> responseList = answerKeys.stream()
                .map(testMapper::toAnswerKeyResponse)
                .toList();

        log.info("✅ Converted to {} response DTOs", responseList.size());

        return Response.<List<AnswerKeyResponse>>builder()
                .success(true)
                .message("Answer keys retrieved successfully")
                .statusCode(HttpStatus.OK.value())
                .data(responseList)
                .build();
    }

    @Override
    @Transactional
    public Response<AnswerKeyResponse> updateAnswerKey(UUID keyId, UpdateAnswerKeyRequest request) {
        log.info("✏️ Starting answer key update for key ID: {}", keyId);

        // ✅ Найти существующий ключ
        AnswerKey answerKey = answerKeyRepository.findById(keyId)
                .orElseThrow(() -> {
                    log.error("❌ Answer key not found with id: {}", keyId);
                    return new NotFoundException("Answer key not found with id: " + keyId);
                });

        log.info("✅ Answer key found: Q{}", answerKey.getQuestionNumber());

        // ✅ Обновить поля из Request (только не-null значения)
        testMapper.updateAnswerKeyFromRequest(request, answerKey);
        log.info("📝 Answer key fields updated");

        // ✅ Сохранить обновленный ключ в БД
        AnswerKey updatedKey = answerKeyRepository.save(answerKey);
        log.info("✅ Answer key saved with id: {}", updatedKey.getId());

        // ✅ Преобразовать Entity → Response DTO
        AnswerKeyResponse response = testMapper.toAnswerKeyResponse(updatedKey);

        log.info("✅ Answer key updated successfully: Q{}", updatedKey.getQuestionNumber());

        return Response.<AnswerKeyResponse>builder()
                .success(true)
                .message("Answer key updated successfully")
                .statusCode(HttpStatus.OK.value())
                .data(response)
                .build();
    }

    @Override
    @Transactional
    public Response<String> deleteAnswerKey(UUID keyId) {
        log.info("🔍 Starting answer key deletion for key ID: {}", keyId);

        // ✅ Найти ключ ответа
        AnswerKey answerKey = answerKeyRepository.findById(keyId)
                .orElseThrow(() -> {
                    log.error("❌ Answer key not found with id: {}", keyId);
                    return new NotFoundException("Answer key not found with id: " + keyId);
                });

        log.info("✅ Answer key found: Q{}", answerKey.getQuestionNumber());

        // ✅ Удалить из БД
        answerKeyRepository.delete(answerKey);
        log.info("✅ Answer key deleted successfully: Q{} (ID: {})", answerKey.getQuestionNumber(), answerKey.getId());

        return Response.<String>builder()
                .success(true)
                .message("Answer key deleted successfully")
                .statusCode(HttpStatus.OK.value())
                .data("Answer key with ID " + keyId + " has been deleted.")
                .build();
    }
}
