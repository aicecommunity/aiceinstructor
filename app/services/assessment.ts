// app/services/assessment.ts
// Real backend authoring endpoints for CalendarUnitAssessment / QuizQuestion /
// PracticalQuestion. These are instructor-scoped; learner reads remain on the
// curriculum endpoints.

import { api } from "./api";
import type {
  CalendarUnitAssessment,
  AssessmentPayload,
  QuizQuestion,
  QuizQuestionPayload,
  PracticalQuestion,
  PracticalQuestionPayload,
} from "../types/assessment";

export const assessment = {
  // GET /api/assessment/units/{unit_id}/  (null if none)
  getAssessment: (unitId: number) =>
    api.get<CalendarUnitAssessment | null>(`/assessment/units/${unitId}/`),

  // PUT /api/assessment/units/{unit_id}/  (creates if missing)
  setAssessment: (unitId: number, payload: AssessmentPayload) =>
    api.put<CalendarUnitAssessment>(`/assessment/units/${unitId}/`, payload),

  // DELETE /api/assessment/units/{unit_id}/
  removeAssessment: (unitId: number) =>
    api.delete(`/assessment/units/${unitId}/`),

  // GET /api/assessment/units/{unit_id}/quiz/
  listQuiz: (unitId: number) =>
    api.get<QuizQuestion[]>(`/assessment/units/${unitId}/quiz/`),

  // POST /api/assessment/units/{unit_id}/quiz/
  createQuiz: (unitId: number, payload: QuizQuestionPayload) =>
    api.post<QuizQuestion>(`/assessment/units/${unitId}/quiz/`, payload),

  // PUT /api/assessment/units/{unit_id}/quiz/{question_id}/
  updateQuiz: (unitId: number, questionId: number, payload: QuizQuestionPayload) =>
    api.put<QuizQuestion>(`/assessment/units/${unitId}/quiz/${questionId}/`, payload),

  // DELETE /api/assessment/units/{unit_id}/quiz/{question_id}/
  deleteQuiz: (unitId: number, questionId: number) =>
    api.delete(`/assessment/units/${unitId}/quiz/${questionId}/`),

  // GET /api/assessment/units/{unit_id}/practical/
  listPractical: (unitId: number) =>
    api.get<PracticalQuestion[]>(`/assessment/units/${unitId}/practical/`),

  // POST /api/assessment/units/{unit_id}/practical/
  createPractical: (unitId: number, payload: PracticalQuestionPayload) =>
    api.post<PracticalQuestion>(`/assessment/units/${unitId}/practical/`, payload),

  // PUT /api/assessment/units/{unit_id}/practical/{question_id}/
  updatePractical: (unitId: number, questionId: number, payload: PracticalQuestionPayload) =>
    api.put<PracticalQuestion>(`/assessment/units/${unitId}/practical/${questionId}/`, payload),

  // DELETE /api/assessment/units/{unit_id}/practical/{question_id}/
  deletePractical: (unitId: number, questionId: number) =>
    api.delete(`/assessment/units/${unitId}/practical/${questionId}/`),
};
