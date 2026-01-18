package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestResponse {

    private UUID id;

    private String title;

    private String subject;

    private String description;

    private Integer totalQuestions;

    private BigDecimal maxScore;

    private Boolean isActive;

    private UUID creatorId;

    private String creatorEmail;

    private LocalDateTime createdAt;
}

