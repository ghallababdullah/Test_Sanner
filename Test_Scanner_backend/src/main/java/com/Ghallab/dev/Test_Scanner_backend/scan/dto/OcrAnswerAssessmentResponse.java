package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrAnswerAssessmentResponse {

    private Integer questionNumber;

    private Double recognizedConfidence;

    private Double tesseractConfidence;

    private Double trocrConfidence;

    private Double combinedConfidence;

    private String engine;

    private String status;

    private Boolean reviewRecommended;
}
