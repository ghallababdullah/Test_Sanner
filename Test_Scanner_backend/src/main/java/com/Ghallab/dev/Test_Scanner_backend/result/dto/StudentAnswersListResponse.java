package com.Ghallab.dev.Test_Scanner_backend.result.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswersListResponse {

    private Integer totalQuestions;

    private Integer answeredCorrectly;

    private Integer answeredPartially;

    private Integer answeredIncorrectly;

    private List<StudentAnswerResponse> answers;
}

