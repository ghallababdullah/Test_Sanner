package com.Ghallab.dev.Test_Scanner_backend.grading.mapper;

import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingAnswerDetail;
import com.Ghallab.dev.Test_Scanner_backend.grading.domain.entity.GradingResult;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.GradingResponse;
import com.Ghallab.dev.Test_Scanner_backend.grading.dto.StudentAnswerResponse;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * GradingMapper - Converts between Grading entities and DTOs
 */
@Component
public class GradingMapper {

    private final ModelMapper modelMapper;

    public GradingMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * Convert GradingResult entity to GradingResponse DTO
     * Uses manual mapping instead of ModelMapper to avoid Hibernate collection issues
     */
    public GradingResponse toGradingResponse(GradingResult gradingResult) {
        GradingResponse response = GradingResponse.builder()
            .gradingResultId(gradingResult.getId())
            .testId(gradingResult.getTest().getId())
            .userEmail(gradingResult.getUser().getEmail())
            .studentName(gradingResult.getStudentName())
            .studentLastName(gradingResult.getStudentLastName())
            .studentClass(gradingResult.getStudentClass())
            .rawScore(gradingResult.getRawScore())
            .maxScore(gradingResult.getMaxScore())
            .percentage(gradingResult.getPercentage())
            .grade(gradingResult.getGrade())
            .feedback(gradingResult.getFeedback())
            .build();

        // Test information and class validation
        String testClass = gradingResult.getTest().getClassLevel();
        String studentClass = gradingResult.getStudentClass();
        response.setTestClass(testClass);

        // Check if classes match
        if (testClass != null && studentClass != null) {
            response.setClassMatchesStudent(testClass.equalsIgnoreCase(studentClass));
        } else {
            response.setClassMatchesStudent(null); // null if either is missing
        }

        // Map answer details - convert Hibernate collection to List
        if (gradingResult.getAnswerDetails() != null && !gradingResult.getAnswerDetails().isEmpty()) {
            response.setAnswerDetails(
                gradingResult.getAnswerDetails().stream()
                    .map(this::toStudentAnswerResponse)
                    .collect(Collectors.toList())
            );
        }

        return response;
    }

    /**
     * Convert GradingAnswerDetail entity to StudentAnswerResponse DTO
     */
    public StudentAnswerResponse toStudentAnswerResponse(GradingAnswerDetail detail) {
        return StudentAnswerResponse.builder()
            .questionNumber(detail.getQuestionNumber())
            .studentAnswer(detail.getStudentAnswer())
            .correctAnswer(detail.getCorrectAnswer())
            .pointsEarned(detail.getPointsEarned())
            .maxPoints(detail.getMaxPoints())
            .distance(detail.getDistance())
            .isCorrect(detail.getIsCorrect())
            .matchType(detail.getMatchType())
            .build();
    }

    /**
     * Convert list of GradingResult to list of GradingResponse
     */
    public List<GradingResponse> toGradingResponseList(List<GradingResult> gradingResults) {
        return gradingResults.stream()
            .map(this::toGradingResponse)
            .collect(Collectors.toList());
    }
}

