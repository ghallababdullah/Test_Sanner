export interface GradeDistributionItem {
  grade: string;
  count: number;
}

export interface QuestionAnalyticsItem {
  questionNumber: number;
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageScore: number;
  accuracyPercentage: number;
}

export interface TopPerformer {
  blankId: string;
  studentName: string;
  studentClass: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
}

export interface TestAnalyticsSummary {
  testId: string;
  title: string;
  subject: string;
  classLevel: string;
  totalScannedBlanks: number;
  scoredBlanks: number;
  needsReviewCount: number;
  averageScore: number;
  averagePercentage: number;
  gradeDistribution: GradeDistributionItem[];
  topMostIncorrectQuestions: QuestionAnalyticsItem[];
  topPerformers: TopPerformer[];
}

export interface UserAnalyticsOverview {
  totalTests: number;
  totalScannedBlanks: number;
  totalScoredBlanks: number;
  totalNeedsReview: number;
  averageScore: number;
  averagePercentage: number;
  overallGradeDistribution: GradeDistributionItem[];
  tests: TestAnalyticsSummary[];
}

export interface TestQuestionBreakdown {
  testId: string;
  title: string;
  questions: QuestionAnalyticsItem[];
}
