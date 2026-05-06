package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import com.Ghallab.dev.Test_Scanner_backend.result.dto.StudentAnswerResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScannedBlankDetailedResponse {

    private UUID id;

    private UUID scanSessionId;

    private UUID testId;

    private String studentName;

    private String studentClass;

    private LocalDate testDate;

    private BigDecimal overallConfidence;

    private Boolean needsReview;

    private String reviewStatus;

    private Map<String, String> answers;

    private Map<String, String> errorCorrections;

    private Map<String, String> finalAnswers;

    private Boolean isErrorCorrectionApplied;

    private Boolean isScored;

    private BigDecimal rawScore;

    private BigDecimal maxScore;

    private BigDecimal percentage;

    private String grade;

    private String feedback;

    private String reviewNotes;

    private Map<String, OcrAnswerAssessmentResponse> answerAssessments;

    private List<StudentAnswerResponse> answerGrades;

    private String originalImagePath;

    private String processedImagePath;

    private String thumbnailPath;

    private String processingStatus;

    private String processingError;

    private LocalDateTime scannedAt;

    private LocalDateTime processedAt;

    private LocalDateTime scoredAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;
}

