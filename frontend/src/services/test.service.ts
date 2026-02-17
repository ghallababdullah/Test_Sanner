import { apiClient } from './api';

export interface TestListItem {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  totalQuestions: number;
  maxScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface TestDetails extends TestListItem {
  description?: string;
  instructions?: string;
  duration?: number;
  createdBy?: string;
}

export interface AnswerKey {
  id: string;
  testId: string;
  questionNumber: number;
  correctAnswer: string;
  explanation?: string;
  createdAt: string;
}

export interface GradeThreshold {
  id: string;
  testId: string;
  minScore: number;
  maxScore: number;
  grade: string;
  percentage?: number;
}

export interface CreateTestPayload {
  title: string;
  subject: string;
  classLevel: string;
  totalQuestions: number;
  maxScore: number;
  description?: string;
  instructions?: string;
  duration?: number;
}

export interface UpdateTestPayload extends Partial<CreateTestPayload> {
  id: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

class TestService {
  /**
   * Get all tests for current user
   */
  async getUserTests(userEmail: string): Promise<TestListItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<TestListItem[]>>(
        `/api/tests/user/${userEmail}`
      );
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Get test details
   */
  async getTestDetails(testId: string): Promise<TestDetails> {
    try {
      const response = await apiClient.get<ApiResponse<TestDetails>>(
        `/api/tests/${testId}/details`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Create new test
   */
  async createTest(payload: CreateTestPayload): Promise<TestDetails> {
    try {
      const response = await apiClient.post<ApiResponse<TestDetails>>(
        '/api/tests',
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Update test
   */
  async updateTest(testId: string, payload: Partial<CreateTestPayload>): Promise<TestDetails> {
    try {
      const response = await apiClient.put<ApiResponse<TestDetails>>(
        `/api/tests/update-test/${testId}`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Delete test
   */
  async deleteTest(testId: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(
        `/api/tests/delete-test/${testId}`
      );
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Activate test
   */
  async activateTest(testId: string): Promise<TestDetails> {
    try {
      const response = await apiClient.post<ApiResponse<TestDetails>>(
        `/api/tests/${testId}/activate`,
        {}
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Get answer keys for test
   */
  async getAnswerKeys(testId: string): Promise<AnswerKey[]> {
    try {
      const response = await apiClient.get<ApiResponse<AnswerKey[]>>(
        `/api/tests/${testId}/answer-keys`
      );
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Add answer key
   */
  async addAnswerKey(
    testId: string,
    payload: Omit<AnswerKey, 'id' | 'testId' | 'createdAt'>
  ): Promise<AnswerKey> {
    try {
      const response = await apiClient.post<ApiResponse<AnswerKey>>(
        `/api/tests/${testId}/answer-keys`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Update answer key
   */
  async updateAnswerKey(
    testId: string,
    keyId: string,
    payload: Partial<Omit<AnswerKey, 'id' | 'testId' | 'createdAt'>>
  ): Promise<AnswerKey> {
    try {
      const response = await apiClient.put<ApiResponse<AnswerKey>>(
        `/api/tests/${testId}/answer-keys/${keyId}`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Delete answer key
   */
  async deleteAnswerKey(testId: string, keyId: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(
        `/api/tests/${testId}/answer-keys/${keyId}`
      );
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Get grade thresholds for test
   */
  async getGradeThresholds(testId: string): Promise<GradeThreshold[]> {
    try {
      const response = await apiClient.get<ApiResponse<GradeThreshold[]>>(
        `/api/tests/${testId}/grade-thresholds`
      );
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Add grade threshold
   */
  async addGradeThreshold(
    testId: string,
    payload: Omit<GradeThreshold, 'id' | 'testId'>
  ): Promise<GradeThreshold> {
    try {
      const response = await apiClient.post<ApiResponse<GradeThreshold>>(
        `/api/tests/${testId}/grade-thresholds`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Update grade threshold
   */
  async updateGradeThreshold(
    testId: string,
    thresholdId: string,
    payload: Partial<Omit<GradeThreshold, 'id' | 'testId'>>
  ): Promise<GradeThreshold> {
    try {
      const response = await apiClient.put<ApiResponse<GradeThreshold>>(
        `/api/tests/${testId}/grade-thresholds/${thresholdId}`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Delete grade threshold
   */
  async deleteGradeThreshold(testId: string, thresholdId: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(
        `/api/tests/${testId}/grade-thresholds/${thresholdId}`
      );
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }
}

export const testService = new TestService();
export default testService;
