// app/services/enrollments.ts

import { api } from "./api";
import type { Enrollment, EnrollmentStats } from "../types/enrollment";

export const enrollments = {
  // GET /api/enrollments/  — active enrollments, no server-side filters.
  list: () => api.get<Enrollment[]>("/enrollments/"),

  // GET /api/enrollments/<id>/stats/  — aggregate counts across all cohorts.
  stats: (id: number) => api.get<EnrollmentStats>(`/enrollments/${id}/stats/`),
};
