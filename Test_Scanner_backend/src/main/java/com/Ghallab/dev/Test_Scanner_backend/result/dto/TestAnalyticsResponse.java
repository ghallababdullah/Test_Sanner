package com.Ghallab.dev.Test_Scanner_backend.result.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestAnalyticsResponse {

    private UUID id;

    private UUID testId;

    private UUID scanSessionId;

    private Integer totalBlanks;

    private BigDecimal averageScore;

    private BigDecimal medianScore;

    private BigDecimal highestScore;

    private BigDecimal lowestScore;

    private BigDecimal standardDeviation;

    private JsonNode gradeDistribution;

    private JsonNode questionAnalysis;

    private Integer totalCorrections;

    private JsonNode commonCorrections;

    private Integer averageProcessingTimeMs;

    private LocalDateTime generatedAt;
}

