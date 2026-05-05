import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type { ScannedBlankDetailedResponse, ScannedBlankResponse } from "../../shared/types/scan";

export async function fetchTestBlanks(testId: string) {
  const { data } = await http.get<ApiResponse<ScannedBlankResponse[]>>(`/scan/test/${testId}/blanks`);
  return data.data;
}

export async function fetchBlankDetails(blankId: string) {
  const { data } = await http.get<ApiResponse<ScannedBlankDetailedResponse>>(`/scan/blank/${blankId}/details`);
  return data.data;
}

export async function deleteBlank(blankId: string) {
  const { data } = await http.delete<ApiResponse<string>>(`/scan/blank/${blankId}`);
  return data.data;
}
