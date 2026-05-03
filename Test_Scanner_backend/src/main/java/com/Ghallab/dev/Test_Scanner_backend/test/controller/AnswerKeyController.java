package com.Ghallab.dev.Test_Scanner_backend.test.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.service.AnswerKeyImpl;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.AnswerKeyResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateAnswerKeyRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateAnswerKeyRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tests/{testId}/answer-keys")
@Slf4j
@AllArgsConstructor
public class AnswerKeyController {
    private final AnswerKeyImpl answerKeyService;

    @PostMapping
    public ResponseEntity<Response<AnswerKeyResponse>> createAnswerKey(
            @PathVariable UUID testId,
            @Valid @RequestBody CreateAnswerKeyRequest request) {

        request.setTestId(testId);
        log.info("Create Answer Key endpoint called for test ID: {}", testId);

        Response<AnswerKeyResponse> response = answerKeyService.createAnswerKey(request);

        log.info("Answer key created successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk")
    public ResponseEntity<Response<List<AnswerKeyResponse>>> createAnswerKeysBulk(
            @PathVariable UUID testId,
            @Valid @RequestBody List<CreateAnswerKeyRequest> requests) {

        log.info("Bulk Create Answer Keys endpoint called for test ID: {}, count={}", testId, requests.size());

        Response<List<AnswerKeyResponse>> response = answerKeyService.createAnswerKeysBulk(testId, requests);

        log.info("Bulk answer keys created successfully for test: {}", testId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Response<List<AnswerKeyResponse>>> getAnswerKeysByTest(
            @PathVariable UUID testId) {

        log.info("Get Answer Keys endpoint called for test ID: {}", testId);

        Response<List<AnswerKeyResponse>> response = answerKeyService.getAnswerKeysByTest(testId);

        log.info("Answer keys retrieved successfully for test: {}", testId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{keyId}")
    public ResponseEntity<Response<AnswerKeyResponse>> updateAnswerKey(
            @PathVariable UUID testId,
            @PathVariable UUID keyId,
            @Valid @RequestBody UpdateAnswerKeyRequest request) {

        log.info("Update Answer Key endpoint called for key ID: {}", keyId);

        Response<AnswerKeyResponse> response = answerKeyService.updateAnswerKey(keyId, request);

        log.info("Answer key updated successfully: {}", keyId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Response<String>> deleteAnswerKey(
            @PathVariable UUID testId,
            @PathVariable UUID keyId) {

        log.info("Delete Answer Key endpoint called for key ID: {}", keyId);

        Response<String> response = answerKeyService.deleteAnswerKey(keyId);

        log.info("Answer key deleted successfully: {}", keyId);

        return ResponseEntity.ok(response);
    }
}
