import type { AxiosProgressEvent } from "axios";
import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type {
  ScanSessionResponse,
  ScannedBlankResponse,
  StartScanSessionRequest
} from "../../shared/types/scan";

function unwrapApiResponse<T>(response: ApiResponse<T>) {
  if (!response.success) {
    throw new Error(response.message || "Request failed");
  }

  return response.data;
}

export async function startScanSession(payload: StartScanSessionRequest) {
  const { data } = await http.post<ApiResponse<ScanSessionResponse>>("/scan/start-session", payload);
  return unwrapApiResponse(data);
}

export async function submitScannedBlank(payload: {
  scanSessionId: string;
  testId: string;
  image: File;
  testDate?: string;
  onUploadProgress?: (event: AxiosProgressEvent) => void;
}) {
  const formData = new FormData();
  formData.append("scanSessionId", payload.scanSessionId);
  formData.append("testId", payload.testId);
  if (payload.testDate) {
    formData.append("testDate", payload.testDate);
  }
  formData.append("image", payload.image);

  const { data } = await http.post<ApiResponse<ScannedBlankResponse>>("/scan/submit-blank", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: payload.onUploadProgress
  });
  return unwrapApiResponse(data);
}

export async function submitScannedBlankForPreview(payload: {
  scanSessionId: string;
  testId: string;
  image: File;
  testDate?: string;
  onUploadProgress?: (event: AxiosProgressEvent) => void;
}) {
  const formData = new FormData();
  formData.append("scanSessionId", payload.scanSessionId);
  formData.append("testId", payload.testId);
  if (payload.testDate) {
    formData.append("testDate", payload.testDate);
  }
  formData.append("image", payload.image);

  const { data } = await http.post<ApiResponse<ScannedBlankResponse>>("/scan/submit-blank-preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: payload.onUploadProgress
  });
  return unwrapApiResponse(data);
}

export async function fetchSessionBlanks(sessionId: string) {
  const { data } = await http.get<ApiResponse<ScannedBlankResponse[]>>(`/scan/session/${sessionId}/blanks`);
  return unwrapApiResponse(data);
}
