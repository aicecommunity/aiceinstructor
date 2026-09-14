// app/services/finance.ts

import { api } from "./api";
import type {
  FinancialAnalysis,
  FinanceConfig,
  FinanceMemberCandidate,
  InstructorFinance,
  RevenueRole,
  RevenueShare,
} from "../types/finance";

export interface RevenueRolePayload {
  name: string;
  description: string;
  color: string;
  percent: number;
}

export interface RevenueSharePayload {
  profile: number;
  role: number;
  label: string;
}

export const finance = {
  // Instructor's per-course money (instructors/admins/superusers).
  instructor: () => api.get<InstructorFinance>("/finance/instructor/"),

  // Superuser money-flow analysis.
  analysis: () => api.get<FinancialAnalysis>("/finance/analysis/"),

  // Revenue split config (superuser).
  config: () => api.get<FinanceConfig>("/finance/config/"),
  updateConfig: (instructor_percent: number) =>
    api.put<FinanceConfig>("/finance/config/", { instructor_percent }),

  // Roles (superuser).
  createRole: (data: RevenueRolePayload) => api.post<RevenueRole>("/finance/roles/", data),
  updateRole: (id: number, data: RevenueRolePayload) =>
    api.put<RevenueRole>(`/finance/roles/${id}/`, data),
  deleteRole: (id: number) => api.delete(`/finance/roles/${id}/`),

  // Member↔role shares (superuser).
  createShare: (data: RevenueSharePayload) => api.post<RevenueShare>("/finance/shares/", data),
  updateShare: (id: number, data: Partial<RevenueSharePayload>) =>
    api.put<RevenueShare>(`/finance/shares/${id}/`, data),
  deleteShare: (id: number) => api.delete(`/finance/shares/${id}/`),

  // Members available for a new share assignment.
  memberCandidates: (q: string) =>
    api.get<FinanceMemberCandidate[]>("/finance/member-candidates/", { params: { q } }),
};