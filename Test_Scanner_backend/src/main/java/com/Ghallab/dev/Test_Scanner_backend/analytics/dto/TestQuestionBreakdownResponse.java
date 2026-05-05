package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestQuestionBreakdownResponse {
    private UUID testId;
    private String title;
    private List<QuestionAnalyticsItemResponse> questions;
}
