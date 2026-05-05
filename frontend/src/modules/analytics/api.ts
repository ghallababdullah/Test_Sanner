import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type { TestAnalyticsSummary, TestQuestionBreakdown, UserAnalyticsOverview } from "../../shared/types/analytics";

export async function fetchOverview() {
  const { data } = await http.get<ApiResponse<UserAnalyticsOverview>>("/analytics/tests/my/overview");
  return data.data;
}

export async function fetchTestSummary(testId: string) {
  const { data } = await http.get<ApiResponse<TestAnalyticsSummary>>(`/analytics/tests/${testId}/summary`);
  return data.data;
}

export async function fetchQuestionBreakdown(testId: string) {
  const { data } = await http.get<ApiResponse<TestQuestionBreakdown>>(`/analytics/tests/${testId}/questions`);
  return data.data;
}
