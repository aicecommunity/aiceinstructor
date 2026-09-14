// app/types/finance.ts
// Types mirroring the aicebackend finance app serializers/views output.

export interface FinanceConfig {
  instructor_percent: number;
  platform_percent: number;
  updated_at: string;
}

export interface CourseFinance {
  course_id: number;
  title: string;
  slug: string;
  paid_enrollments: number;
  collections: number;
  instructor_share: number;
  platform_share: number;
}

export interface FinanceTotals {
  collections: number;
  instructor_share: number;
  platform_share: number;
}

// GET /api/finance/instructor/
export interface InstructorFinance {
  currency: string;
  config: FinanceConfig;
  courses: CourseFinance[];
  totals: FinanceTotals;
}

export interface RevenueRole {
  id: number;
  name: string;
  description: string;
  color: string;
  percent: number;
  member_count: number;
}

export interface ShareProfile {
  user_id: number;
  full_name: string;
  email: string | null;
  aice_id: string;
}

export interface RevenueShare {
  id: number;
  profile: ShareProfile;
  role: { id: number; name: string; color: string };
  label: string;
}

export interface ShareAllocation {
  share_id: number;
  label: string;
  role_name: string;
  role_color: string;
  percent: number;
  amount: number;
}

export interface AnalysisCourse extends CourseFinance {
  members: ShareAllocation[];
}

export interface MemberTotal {
  share_id: number;
  full_name: string;
  label: string;
  role_name: string;
  role_color: string;
  percent: number;
  amount: number;
}

export interface FinanceValidation {
  allocated_percent: number;
  platform_percent: number;
  unallocated_percent: number;
  status: "balanced" | "over_allocated" | "under_allocated";
}

// GET /api/finance/analysis/
export interface FinancialAnalysis {
  config: FinanceConfig;
  roles: RevenueRole[];
  shares: RevenueShare[];
  courses: AnalysisCourse[];
  totals: FinanceTotals;
  member_totals: MemberTotal[];
  validation: FinanceValidation;
}

// GET /api/finance/member-candidates/?q=...
export interface FinanceMemberCandidate {
  user_id: number;
  full_name: string;
  email: string | null;
  username: string;
  aice_id: string;
}