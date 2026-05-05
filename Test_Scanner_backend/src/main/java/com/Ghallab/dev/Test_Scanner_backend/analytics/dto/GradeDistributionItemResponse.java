package com.Ghallab.dev.Test_Scanner_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeDistributionItemResponse {
    private String grade;
    private Integer count;
}
