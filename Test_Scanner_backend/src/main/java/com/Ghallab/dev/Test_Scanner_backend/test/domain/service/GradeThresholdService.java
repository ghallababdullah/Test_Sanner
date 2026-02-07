package com.Ghallab.dev.Test_Scanner_backend.test.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateGradeThresholdRequest;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.GradeThresholdResponse;
import com.Ghallab.dev.Test_Scanner_backend.test.dto.UpdateGradeThresholdRequest;

import java.util.List;
import java.util.UUID;

public interface GradeThresholdService {
    // ПОРОГИ ОЦЕНОК (GradeThreshold)
    Response<List<GradeThresholdResponse>> createGradeThresholds(UUID testId, List<CreateGradeThresholdRequest> requests);
    Response<GradeThresholdResponse> createGradeThreshold(CreateGradeThresholdRequest request);
    Response<List<GradeThresholdResponse>> getGradeThresholdsByTest(UUID testId);
    Response<GradeThresholdResponse> updateGradeThreshold(UUID thresholdId, UpdateGradeThresholdRequest request);
    Response<String> deleteGradeThreshold(UUID thresholdId);
}
