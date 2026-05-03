package com.Ghallab.dev.Test_Scanner_backend.result.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.StudentAnswer;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.TestResult;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.StudentAnswerRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.TestResultRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.AnswerKeyRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.GradeThresholdRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScannedBlankResultService {

    private final AnswerKeyRepository answerKeyRepository;
    private final GradeThresholdRepository gradeThresholdRepository;
    private final TestResultRepository testResultRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public TestResult evaluateAndPersist(ScannedBlank blank) {
        Map<String, String> extractedAnswers = readStringMap(blank.getAnswers());
        Map<String, String> finalAnswers = buildFinalAnswers(blank, extractedAnswers);

        List<AnswerKey> answerKeys = answerKeyRepository.findByTestId(blank.getTest().getId()).stream()
                .sorted(Comparator.comparing(AnswerKey::getQuestionNumber))
                .toList();
        List<GradeThreshold> gradeThresholds = gradeThresholdRepository.findByTestId(blank.getTest().getId());

        if (answerKeys.isEmpty()) {
            throw new IllegalStateException("No answer keys found for test " + blank.getTest().getId());
        }

        List<StudentAnswer> existingAnswers = studentAnswerRepository.findByScannedBlankId(blank.getId());
        if (!existingAnswers.isEmpty()) {
            studentAnswerRepository.deleteAll(existingAnswers);
        }

        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        List<StudentAnswer> persistedAnswers = new ArrayList<>();

        for (AnswerKey answerKey : answerKeys) {
            String questionKey = String.valueOf(answerKey.getQuestionNumber());
            String studentAnswer = extractedAnswers.get(questionKey);
            String finalAnswer = finalAnswers.get(questionKey);

            BigDecimal score = calculateScore(finalAnswer, answerKey);
            totalScore = totalScore.add(score);
            maxScore = maxScore.add(answerKey.getMaxPoints());

            int distance = levenshteinDistance(normalize(finalAnswer), normalize(answerKey.getCorrectAnswer()));
            String matchType = determineMatchType(distance, answerKey.getToleranceLevel());

            StudentAnswer answer = new StudentAnswer();
            answer.setScannedBlank(blank);
            answer.setAnswerKey(answerKey);
            answer.setQuestionNumber(answerKey.getQuestionNumber());
            answer.setCorrectAnswer(answerKey.getCorrectAnswer());
            answer.setStudentAnswer(studentAnswer);
            answer.setFinalAnswer(finalAnswer);
            answer.setScore(score);
            answer.setMaxPoints(answerKey.getMaxPoints());
            answer.setMatchType(matchType);
            answer.setMetadata(buildAnswerMetadata(answerKey, studentAnswer, finalAnswer, distance));
            persistedAnswers.add(studentAnswerRepository.save(answer));
        }

        BigDecimal percentage = calculatePercentage(totalScore, maxScore);
        String grade = calculateGrade(percentage, gradeThresholds);
        String feedback = "Score: " + totalScore + "/" + maxScore + " (" + percentage + "%) - Grade: " + grade;

        TestResult result = testResultRepository.findByScannedBlankId(blank.getId()).orElseGet(TestResult::new);
        result.setScannedBlank(blank);
        result.setTest(blank.getTest());
        result.setTotalScore(totalScore);
        result.setMaxScore(maxScore);
        result.setPercentage(percentage);
        result.setGrade(grade);
        result.setStatus(TestResult.ResultStatus.COMPLETED);
        TestResult savedResult = testResultRepository.save(result);

        log.info("Saved test result {} for scanned blank {}", savedResult.getId(), blank.getId());
        log.debug("Saved {} answer grades for scanned blank {}", persistedAnswers.size(), blank.getId());
        return savedResult;
    }

    public Map<String, String> buildFinalAnswers(ScannedBlank blank) {
        return buildFinalAnswers(blank, readStringMap(blank.getAnswers()));
    }

    public Map<String, String> filterAnswersForTest(UUID testId, Map<String, String> answers) {
        if (answers == null || answers.isEmpty()) {
            return new LinkedHashMap<>();
        }

        Set<String> allowedQuestionNumbers = answerKeyRepository.findByTestIdOrderByQuestionNumber(testId).stream()
                .map(answerKey -> String.valueOf(answerKey.getQuestionNumber()))
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));

        Map<String, String> filtered = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : answers.entrySet()) {
            String key = normalizeQuestionKey(entry.getKey());
            String value = entry.getValue();
            if (!allowedQuestionNumbers.contains(key)) {
                continue;
            }
            if (value == null || value.isBlank()) {
                continue;
            }
            filtered.put(key, value);
        }
        return filtered;
    }

    public Map<String, String> readStringMap(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            Map<String, String> parsed = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
            return parsed == null ? new LinkedHashMap<>() : new LinkedHashMap<>(parsed);
        } catch (Exception exc) {
            throw new IllegalStateException("Failed to parse answers JSON", exc);
        }
    }

    private Map<String, String> buildFinalAnswers(ScannedBlank blank, Map<String, String> extractedAnswers) {
        Map<String, String> finalAnswers = new LinkedHashMap<>(
                filterAnswersForTest(blank.getTest().getId(), extractedAnswers)
        );
        Map<String, String> corrections = filterAnswersForTest(
                blank.getTest().getId(),
                readStringMap(blank.getErrorCorrections())
        );
        for (Map.Entry<String, String> entry : corrections.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isBlank()) {
                finalAnswers.put(entry.getKey(), entry.getValue());
            }
        }
        return finalAnswers;
    }

    private BigDecimal calculateScore(String answer, AnswerKey answerKey) {
        String student = normalize(answer);
        String correct = normalize(answerKey.getCorrectAnswer());

        int distance = levenshteinDistance(student, correct);
        if (distance == 0) {
            return answerKey.getMaxPoints();
        }
        if (distance <= answerKey.getToleranceLevel()) {
            BigDecimal earned = answerKey.getMaxPoints().subtract(BigDecimal.valueOf(distance));
            return earned.max(BigDecimal.ZERO);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculatePercentage(BigDecimal score, BigDecimal maxScore) {
        if (maxScore.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return score.divide(maxScore, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String calculateGrade(BigDecimal percentage, List<GradeThreshold> thresholds) {
        int value = percentage.intValue();
        for (GradeThreshold threshold : thresholds) {
            if (value >= threshold.getMinPercentage() && value <= threshold.getMaxPercentage()) {
                return threshold.getGradeSymbol();
            }
        }
        return "2";
    }

    private String determineMatchType(int distance, Integer toleranceLevel) {
        if (distance == 0) {
            return "EXACT";
        }
        if (distance == 1) {
            return "TOLERANCE_1";
        }
        if (distance == 2 && toleranceLevel != null && toleranceLevel >= 2) {
            return "TOLERANCE_2";
        }
        return "NO_MATCH";
    }

    private JsonNode buildAnswerMetadata(AnswerKey answerKey, String studentAnswer, String finalAnswer, int distance) {
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("distance", distance);
        metadata.put("toleranceLevel", answerKey.getToleranceLevel());
        metadata.put("answerType", answerKey.getAnswerType().name());
        metadata.put("wasCorrected", studentAnswer != null && finalAnswer != null && !normalize(studentAnswer).equals(normalize(finalAnswer)));
        metadata.put("originalAnswer", studentAnswer == null ? "" : studentAnswer);
        metadata.put("finalAnswer", finalAnswer == null ? "" : finalAnswer);
        return metadata;
    }

    private int levenshteinDistance(String left, String right) {
        int len1 = left.length();
        int len2 = right.length();
        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[len1][len2];
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replace(" ", "").toUpperCase();
    }

    private String normalizeQuestionKey(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        if (trimmed.chars().allMatch(Character::isDigit)) {
            try {
                return String.valueOf(Integer.parseInt(trimmed));
            } catch (NumberFormatException ignored) {
                return trimmed;
            }
        }
        return trimmed;
    }
}
