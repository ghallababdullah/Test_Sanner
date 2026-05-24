package com.Ghallab.dev.Test_Scanner_backend.analytics.service;

import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.GradeDistributionItemResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.QuestionAnalyticsItemResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestAnalyticsSummaryResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TestQuestionBreakdownResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.TopPerformerResponse;
import com.Ghallab.dev.Test_Scanner_backend.analytics.dto.UserAnalyticsOverviewResponse;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.StudentAnswer;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.TestResult;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.StudentAnswerRepository;
import com.Ghallab.dev.Test_Scanner_backend.result.domain.repository.TestResultRepository;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScannedBlankRepository;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import com.Ghallab.dev.Test_Scanner_backend.test.domain.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final ScannedBlankRepository scannedBlankRepository;
    private final TestResultRepository testResultRepository;
    private final StudentAnswerRepository studentAnswerRepository;

    @Override
    public TestAnalyticsSummaryResponse getTestSummary(UUID testId, String userEmail) {
        Test test = getOwnedTest(testId, userEmail);
        List<ScannedBlank> blanks = scannedBlankRepository.findByTestId(testId);
        List<TestResult> results = testResultRepository.findByScannedBlankTestId(testId);
        List<StudentAnswer> answers = studentAnswerRepository.findByScannedBlankTestId(testId);
        return buildTestSummary(test, blanks, results, answers);
    }

    @Override
    public TestQuestionBreakdownResponse getQuestionBreakdown(UUID testId, String userEmail) {
        Test test = getOwnedTest(testId, userEmail);
        List<StudentAnswer> answers = studentAnswerRepository.findByScannedBlankTestId(testId);
        return new TestQuestionBreakdownResponse(
                test.getId(),
                test.getTitle(),
                buildQuestionAnalytics(answers)
        );
    }

    @Override
    public List<TestAnalyticsSummaryResponse> getCurrentUserTestSummaries(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Test> tests = testRepository.findByCreatorId(user.getId());
        if (tests.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> testIds = tests.stream().map(Test::getId).toList();
        Map<UUID, List<ScannedBlank>> blanksByTest = scannedBlankRepository.findByTestIdIn(testIds).stream()
                .collect(Collectors.groupingBy(blank -> blank.getTest().getId()));
        Map<UUID, List<TestResult>> resultsByTest = testResultRepository.findByScannedBlankTestIdIn(testIds).stream()
                .collect(Collectors.groupingBy(result -> result.getScannedBlank().getTest().getId()));
        Map<UUID, List<StudentAnswer>> answersByTest = studentAnswerRepository.findByScannedBlankTestIdIn(testIds).stream()
                .collect(Collectors.groupingBy(answer -> answer.getScannedBlank().getTest().getId()));

        return tests.stream()
                .map(test -> buildTestSummary(
                        test,
                        blanksByTest.getOrDefault(test.getId(), List.of()),
                        resultsByTest.getOrDefault(test.getId(), List.of()),
                        answersByTest.getOrDefault(test.getId(), List.of())
                ))
                .sorted(Comparator.comparing(TestAnalyticsSummaryResponse::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    public UserAnalyticsOverviewResponse getCurrentUserOverview(String userEmail) {
        List<TestAnalyticsSummaryResponse> summaries = getCurrentUserTestSummaries(userEmail);

        int totalTests = summaries.size();
        int totalScannedBlanks = summaries.stream().mapToInt(TestAnalyticsSummaryResponse::getTotalScannedBlanks).sum();
        int totalScoredBlanks = summaries.stream().mapToInt(TestAnalyticsSummaryResponse::getScoredBlanks).sum();
        int totalNeedsReview = summaries.stream().mapToInt(TestAnalyticsSummaryResponse::getNeedsReviewCount).sum();

        BigDecimal averageScore = averageFromSummaries(
                summaries,
                TestAnalyticsSummaryResponse::getAverageScore,
                TestAnalyticsSummaryResponse::getScoredBlanks
        );
        BigDecimal averagePercentage = averageFromSummaries(
                summaries,
                TestAnalyticsSummaryResponse::getAveragePercentage,
                TestAnalyticsSummaryResponse::getScoredBlanks
        );

        Map<String, Integer> gradeDistributionMap = new LinkedHashMap<>();
        for (TestAnalyticsSummaryResponse summary : summaries) {
            for (GradeDistributionItemResponse item : summary.getGradeDistribution()) {
                gradeDistributionMap.merge(item.getGrade(), item.getCount(), Integer::sum);
            }
        }

        return new UserAnalyticsOverviewResponse(
                totalTests,
                totalScannedBlanks,
                totalScoredBlanks,
                totalNeedsReview,
                averageScore,
                averagePercentage,
                toGradeDistributionList(gradeDistributionMap),
                summaries
        );
    }

    private Test getOwnedTest(UUID testId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));
        if (test.getCreator() == null || !user.getId().equals(test.getCreator().getId())) {
            throw new NotFoundException("Test not found");
        }
        return test;
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private TestAnalyticsSummaryResponse buildTestSummary(
            Test test,
            List<ScannedBlank> blanks,
            List<TestResult> results,
            List<StudentAnswer> answers
    ) {
        int totalScannedBlanks = blanks.size();
        int scoredBlanks = results.size();
        int needsReviewCount = (int) blanks.stream().filter(blank -> Boolean.TRUE.equals(blank.getNeedsReview())).count();

        BigDecimal averageScore = averageBigDecimal(results.stream().map(TestResult::getTotalScore).toList());
        BigDecimal averagePercentage = averageBigDecimal(results.stream().map(TestResult::getPercentage).toList());

        Map<String, Integer> gradeDistributionMap = new LinkedHashMap<>();
        for (TestResult result : results) {
            String grade = result.getGrade() == null || result.getGrade().isBlank() ? "N/A" : result.getGrade();
            gradeDistributionMap.merge(grade, 1, Integer::sum);
        }

        List<QuestionAnalyticsItemResponse> questionAnalytics = buildQuestionAnalytics(answers);
        List<QuestionAnalyticsItemResponse> topMostIncorrectQuestions = questionAnalytics.stream()
                .sorted(Comparator
                        .comparing(QuestionAnalyticsItemResponse::getAccuracyPercentage)
                        .thenComparing(QuestionAnalyticsItemResponse::getQuestionNumber))
                .limit(5)
                .toList();

        return new TestAnalyticsSummaryResponse(
                test.getId(),
                test.getTitle(),
                test.getSubject(),
                test.getClassLevel(),
                totalScannedBlanks,
                scoredBlanks,
                needsReviewCount,
                averageScore,
                averagePercentage,
                toGradeDistributionList(gradeDistributionMap),
                topMostIncorrectQuestions,
                buildTopPerformers(results)
        );
    }

    private List<QuestionAnalyticsItemResponse> buildQuestionAnalytics(List<StudentAnswer> answers) {
        Map<Integer, List<StudentAnswer>> byQuestion = answers.stream()
                .collect(Collectors.groupingBy(StudentAnswer::getQuestionNumber));

        return byQuestion.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<StudentAnswer> questionAnswers = entry.getValue();
                    int totalAnswers = questionAnswers.size();
                    int correctAnswers = (int) questionAnswers.stream()
                            .filter(answer -> answer.getScore() != null
                                    && answer.getMaxPoints() != null
                                    && answer.getScore().compareTo(answer.getMaxPoints()) == 0)
                            .count();
                    int incorrectAnswers = totalAnswers - correctAnswers;
                    BigDecimal averageScore = averageBigDecimal(
                            questionAnswers.stream().map(StudentAnswer::getScore).toList()
                    );
                    BigDecimal accuracyPercentage = percentage(correctAnswers, totalAnswers);
                    return new QuestionAnalyticsItemResponse(
                            entry.getKey(),
                            totalAnswers,
                            correctAnswers,
                            incorrectAnswers,
                            averageScore,
                            accuracyPercentage
                    );
                })
                .toList();
    }

    private BigDecimal averageFromSummaries(
            List<TestAnalyticsSummaryResponse> summaries,
            Function<TestAnalyticsSummaryResponse, BigDecimal> valueExtractor,
            Function<TestAnalyticsSummaryResponse, Integer> weightExtractor
    ) {
        BigDecimal total = BigDecimal.ZERO;
        int weight = 0;
        for (TestAnalyticsSummaryResponse summary : summaries) {
            BigDecimal value = valueExtractor.apply(summary);
            int currentWeight = weightExtractor.apply(summary);
            if (value == null || currentWeight <= 0) {
                continue;
            }
            total = total.add(value.multiply(BigDecimal.valueOf(currentWeight)));
            weight += currentWeight;
        }
        if (weight == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return total.divide(BigDecimal.valueOf(weight), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal averageBigDecimal(Collection<BigDecimal> values) {
        List<BigDecimal> present = values.stream().filter(value -> value != null).toList();
        if (present.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal total = present.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(present.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(int numerator, int denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }

    private List<GradeDistributionItemResponse> toGradeDistributionList(Map<String, Integer> distribution) {
        return distribution.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new GradeDistributionItemResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private List<TopPerformerResponse> buildTopPerformers(List<TestResult> results) {
        return results.stream()
                .sorted(Comparator
                        .comparing(TestResult::getPercentage, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TestResult::getTotalScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(result -> {
                    ScannedBlank blank = result.getScannedBlank();
                    return new TopPerformerResponse(
                            blank != null ? blank.getId() : null,
                            blank != null ? blank.getStudentName() : null,
                            blank != null ? blank.getStudentClass() : null,
                            result.getTotalScore(),
                            result.getMaxScore(),
                            result.getPercentage(),
                            result.getGrade()
                    );
                })
                .toList();
    }
}
