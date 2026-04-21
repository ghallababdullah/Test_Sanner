package com.Ghallab.dev.Test_Scanner_backend.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * GradingRequest DTO - Input for grading evaluation
 * Contains student answers that need to be graded
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest {

    private UUID testId;
    private String userEmail;

    // Student information from the blank/paper
    private String studentName;
    private String studentLastName;
    private String studentClass;

    private List<StudentAnswerInput> answers;

    /**
     * Inner class for individual answer input
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAnswerInput {
        private Integer questionNumber;
        private String answer;
    }
}

