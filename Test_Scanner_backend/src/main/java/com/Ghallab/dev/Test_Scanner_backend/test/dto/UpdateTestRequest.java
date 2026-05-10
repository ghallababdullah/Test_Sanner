package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTestRequest {

    private String title;

    private String subject;

    private String classLevel;

    private String description;

    private Integer totalQuestions;

    private BigDecimal maxScore;

    private Boolean isActive;
}

