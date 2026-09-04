// app/services/cohorts.ts

import { api } from "./api";
import type { Cohort, CohortMember, PaginatedResults } from "../types/enrollment";
import type { CohortProgress } from "../types/records";

export const cohorts = {
  // GET /api/cohorts/  — all cohorts, no server-side filters.
  list: () => api.get<Cohort[]>("/cohorts/"),

  // GET /api/cohorts/enrollments/{enrollment_id}/cohorts/  — server-side filter by enrollment.
  listByEnrollment: (enrollmentId: number) =>
    api.get<Cohort[]>(`/cohorts/enrollments/${enrollmentId}/cohorts/`),

  // GET /api/cohorts/{id}/members/  — paginated members; backend filters role="student".
  members: (cohortId: number, page = 1, pageSize = 50, search = "") =>
    api.get<PaginatedResults<CohortMember>>(`/cohorts/${cohortId}/members/`, {
      params: { page, page_size: pageSize, search: search || undefined },
    }),

  // GET /api/cohorts/{id}/progress/  — REAL aggregate course progress (CohortProgressView).
  progress: (cohortId: number) => api.get<CohortProgress>(`/cohorts/${cohortId}/progress/`),
};
