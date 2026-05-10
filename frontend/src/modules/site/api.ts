import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";

export type SiteContactType = "SUPPORT" | "COLLABORATION";

export interface SiteContactRequest {
  type: SiteContactType;
  name: string;
  email: string;
  organization?: string;
  subject: string;
  message: string;
}

export async function sendSiteContactMessage(payload: SiteContactRequest) {
  const { data } = await http.post<ApiResponse<string>>("/site/contact", payload);
  return data.data;
}
