// app/services/students.ts

import { api } from "./api";
import type { CohortRecords, PracticalSubmission, GradingOverridePayload } from "../types/records";

export const students = {
  // GET /api/cohorts/{id}/records/  — instructor roster + per-learner records.
  records: (cohortId: number) => api.get<CohortRecords>(`/cohorts/${cohortId}/records/`),

  // GET /api/assessment/submissions/{id}/  — single practical submission detail.
  submission: (submissionId: number) =>
    api.get<PracticalSubmission>(`/assessment/submissions/${submissionId}/`),

  // PATCH /api/assessment/submissions/{id}/  — instructor grade override.
  gradeSubmission: (submissionId: number, payload: GradingOverridePayload) =>
    api.patch<PracticalSubmission>(`/assessment/submissions/${submissionId}/`, {
      score: payload.score,
      status: payload.status,
      feedback: payload.feedback,
      reason: payload.reason,
    }),
};