import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type {
  AnswerKeyResponse,
  CreateAnswerKeyRequest,
  CreateGradeThresholdRequest,
  CreateTestRequest,
  GradeThresholdResponse,
  TestResponse,
  TestWithDetailsResponse,
  UpdateAnswerKeyRequest,
  UpdateTestRequest
} from "../../shared/types/tests";

export async function fetchTests() {
  const { data } = await http.get<ApiResponse<TestResponse[]>>("/tests");
  return data.data;
}

export async function fetchTestDetails(testId: string) {
  const { data } = await http.get<ApiResponse<TestWithDetailsResponse>>(`/tests/${testId}/details`);
  return data.data;
}

export async function createTest(payload: CreateTestRequest) {
  const { data } = await http.post<ApiResponse<TestResponse>>("/tests/create-test", payload);
  return data.data;
}

export async function updateTest(testId: string, payload: UpdateTestRequest) {
  const { data } = await http.put<ApiResponse<TestResponse>>(`/tests/update-test/${testId}`, payload);
  return data.data;
}

export async function fetchAnswerKeys(testId: string) {
  const { data } = await http.get<ApiResponse<AnswerKeyResponse[]>>(`/tests/${testId}/answer-keys`);
  return data.data;
}

export async function createAnswerKeys(testId: string, payload: CreateAnswerKeyRequest[]) {
  const { data } = await http.post<ApiResponse<AnswerKeyResponse[]>>(`/tests/${testId}/answer-keys/bulk`, payload);
  return data.data;
}

export async function updateAnswerKey(testId: string, keyId: string, payload: UpdateAnswerKeyRequest) {
  const { data } = await http.put<ApiResponse<AnswerKeyResponse>>(`/tests/${testId}/answer-keys/${keyId}`, payload);
  return data.data;
}

export async function fetchGradeThresholds(testId: string) {
  const { data } = await http.get<ApiResponse<GradeThresholdResponse[]>>(`/tests/${testId}/grade-thresholds`);
  return data.data;
}

export async function createGradeThresholds(testId: string, payload: CreateGradeThresholdRequest[]) {
  const { data } = await http.post<ApiResponse<GradeThresholdResponse[]>>(`/tests/${testId}/grade-thresholds`, payload);
  return data.data;
}
