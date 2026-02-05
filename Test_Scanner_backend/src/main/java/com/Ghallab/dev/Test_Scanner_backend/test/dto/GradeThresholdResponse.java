package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeThresholdResponse {

    private UUID id;

    private UUID testId;

    private String gradeName;

    private String gradeSymbol;

    private Integer minPercentage;

    private Integer maxPercentage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long version;
}

