package com.Ghallab.dev.Test_Scanner_backend.result.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnalysisResponse {

    private Integer questionNumber;

    private Integer totalAnswered;

    private Integer correctAnswers;

    private Integer partiallyCorrect;

    private Integer incorrect;

    private BigDecimal averageScore;

    private List<String> commonMistakes;
}

