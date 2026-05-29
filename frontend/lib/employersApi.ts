import { apiGet, apiPatch } from "./apiClient";

export type RepaymentMethod = "self_pay" | "salary_deduction";

export interface EmployerSearchResult {
  id: string;
  name: string;
}

export interface DealRepaymentPayload {
  repaymentMethod: RepaymentMethod;
  employerId?: string;
  employeeId?: string;
  deductionDay?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function searchEmployers(
  name: string,
): Promise<EmployerSearchResult[]> {
  const params = new URLSearchParams();
  if (name.trim()) params.set("name", name.trim());
  const query = params.toString();
  const res = await apiGet<ApiResponse<EmployerSearchResult[]>>(
    `/api/employers/search${query ? `?${query}` : ""}`,
  );
  return res.data;
}

export async function updateDealRepayment(
  dealId: string,
  payload: DealRepaymentPayload,
): Promise<void> {
  await apiPatch<ApiResponse<unknown>>(`/api/deals/${dealId}/repayment`, payload);
}
