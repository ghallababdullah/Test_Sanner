import { apiClient } from './api';
import { testService } from './test.service';

export interface AnswerDetail {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  pointsEarned: number;
  maxPoints: number;
  distance: number;
  isCorrect: boolean;
  matchType: 'EXACT' | 'PARTIAL' | 'SIMILAR';
}

export interface GradingResult {
  gradingResultId: string;
  testId: string;
  userId: string;
  studentName: string;
  studentLastName: string;
  studentClass: string;
  testClass: string;
  classMatchesStudent: boolean;
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback: string;
  answerDetails: AnswerDetail[];
}

export interface StudentResult {
  gradingResultId: string;
  testId: string;
  userId: string;
  studentName: string;
  studentLastName: string;
  studentClass: string;
  testClass: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
}

export interface TestResultsSummary {
  testId: string;
  testTitle: string;
  totalStudents: number;
  averageScore: number;
  results: StudentResult[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

class ResultsService {
  /**
   * Get all results for a specific test
   */
  async getTestResults(testId: string): Promise<StudentResult[]> {
    try {
      console.log('📊 Fetching results for test:', testId);
      const response = await apiClient.get<ApiResponse<StudentResult[]>>(
        `/api/grading/results/${testId}`
      );
      console.log('✅ Test results loaded:', response.data.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching test results:', error);
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Get all results for current user (grouped by test)
   */
  async getUserResults(userId: string): Promise<TestResultsSummary[]> {
    try {
      console.log('📊 Fetching results for user:', userId);
      const response = await apiClient.get<ApiResponse<StudentResult[]>>(
        `/api/grading/results/user/${userId}`
      );
      const results = response.data.data || [];
      console.log('✅ Results loaded for', results.length, 'students');
      
      if (results.length === 0) {
        return [];
      }
      
      // Get unique test IDs
      const testIds = Array.from(new Set(results.map(r => r.testId)));
      
      // Fetch test titles for all tests
      const testTitles = new Map<string, string>();
      for (const testId of testIds) {
        try {
          const testDetails = await testService.getTestDetails(testId);
          testTitles.set(testId, testDetails.title);
        } catch (error) {
          console.warn(`Could not fetch title for test ${testId}`);
          testTitles.set(testId, `Test ${testId.substring(0, 8)}`);
        }
      }
      
      // Group results by test
      const grouped = this.groupResultsByTest(results, testTitles);
      return grouped;
    } catch (error: any) {
      console.error('❌ Error fetching user results:', error);
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Get detailed results for a specific grading result (student)
   */
  async getResultDetails(gradingResultId: string): Promise<GradingResult> {
    try {
      console.log('📊 Fetching result details for:', gradingResultId);
      const response = await apiClient.get<ApiResponse<GradingResult>>(
        `/api/grading/results/${gradingResultId}/details`
      );
      console.log('✅ Result details loaded:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching result details:', error);
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Group results by test
   */
  private groupResultsByTest(results: StudentResult[], testTitles?: Map<string, string>): TestResultsSummary[] {
    const grouped = new Map<string, StudentResult[]>();

    results.forEach(result => {
      if (!grouped.has(result.testId)) {
        grouped.set(result.testId, []);
      }
      grouped.get(result.testId)!.push(result);
    });

    return Array.from(grouped.entries()).map(([testId, testResults]) => ({
      testId,
      testTitle: testTitles?.get(testId) || 'Test Results',
      totalStudents: testResults.length,
      averageScore: testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length,
      results: testResults,
    }));
  }
}

export const resultsService = new ResultsService();
export default resultsService;
