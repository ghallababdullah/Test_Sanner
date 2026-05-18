import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type { RoiBox, RoiMeta, ScannedBlankDetailedResponse, ScannedBlankResponse } from "../../shared/types/scan";

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

export async function fetchBlankAsset(
  blankId: string,
  kind: "original" | "processed" | "annotated" | "thumbnail",
  version?: string
) {
  const { data } = await http.get<Blob>(`/scan/blank/${blankId}/asset/${kind}`, {
    params: version ? { v: version } : undefined,
    responseType: "blob"
  });
  return data;
}

export async function fetchBlankRoiMetadata(blankId: string) {
  const { data } = await http.get<ApiResponse<RoiMeta[]>>(`/scan/blank/${blankId}/roi-metadata`);
  return data.data;
}

export async function fetchBlankRoiOverrides(blankId: string) {
  const { data } = await http.get<ApiResponse<Record<string, RoiBox>>>(`/scan/blank/${blankId}/roi-overrides`);
  return data.data;
}

export async function saveBlankRoiOverrides(blankId: string, overrides: Record<string, RoiBox>) {
  const { data } = await http.put<ApiResponse<Record<string, RoiBox>>>(`/scan/blank/${blankId}/roi-overrides`, {
    overrides
  });
  return data.data;
}

export async function retryBlankOcr(blankId: string) {
  const { data } = await http.post<ApiResponse<ScannedBlankResponse>>(`/scan/blank/${blankId}/retry-ocr`);
  return data.data;
}

export async function refreshBlankPreview(blankId: string) {
  const { data } = await http.post<ApiResponse<ScannedBlankResponse>>(`/scan/blank/${blankId}/refresh-preview`);
  return data.data;
}

export async function applyBlankCorrections(blankId: string, errorCorrections: Record<string, string>) {
  const { data } = await http.put<ApiResponse<ScannedBlankResponse>>(`/scan/blank/${blankId}/apply-corrections`, {
    errorCorrections
  });
  return data.data;
}
