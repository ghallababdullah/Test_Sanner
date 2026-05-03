package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.AnswerKeyResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateAnswerKeyRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateAnswerKeyRequest;

import java.util.List;
import java.util.UUID;

public interface AnswerkeyService {
    Response<AnswerKeyResponse> createAnswerKey(CreateAnswerKeyRequest request);

    Response<List<AnswerKeyResponse>> createAnswerKeysBulk(UUID testId, List<CreateAnswerKeyRequest> requests);

    Response<List<AnswerKeyResponse>> getAnswerKeysByTest(UUID testId);

    Response<AnswerKeyResponse> updateAnswerKey(UUID keyId, UpdateAnswerKeyRequest request);

    Response<String> deleteAnswerKey(UUID keyId);
}
