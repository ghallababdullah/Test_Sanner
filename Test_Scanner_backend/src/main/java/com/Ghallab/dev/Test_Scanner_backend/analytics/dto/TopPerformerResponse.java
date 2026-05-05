package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopPerformerResponse {
    private UUID blankId;
    private String studentName;
    private String studentClass;
    private BigDecimal rawScore;
    private BigDecimal maxScore;
    private BigDecimal percentage;
    private String grade;
}
