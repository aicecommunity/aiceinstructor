// app/services/certificates.ts — certificate signatories & per-course assignments.
// All endpoints are superuser-only (courses.permissions.IsSuperuserOnly).

import { api } from "./api";
import type {
  Signatory,
  SignatoryPayload,
  CertificateCourse,
  AssignSignatoriesRequest,
} from "../types/certificates";

export const certificates = {
  // Certificate signatories CRUD — /api/certificates/signatories/
  listSignatories: () => api.get<Signatory[]>("/certificates/signatories/"),
  createSignatory: (data: SignatoryPayload) => api.post<Signatory>("/certificates/signatories/", data),
  updateSignatory: (id: number, data: SignatoryPayload) =>
    api.put<Signatory>(`/certificates/signatories/${id}/`, data),
  deleteSignatory: (id: number) => api.delete(`/certificates/signatories/${id}/`),

  // Courses with assigned signatories — /api/certificates/courses/
  listCourses: () => api.get<CertificateCourse[]>("/certificates/courses/"),
  assignSignatories: (courseId: number, data: AssignSignatoriesRequest) =>
    api.put<CertificateCourse>(`/certificates/courses/${courseId}/signatories/`, data),
};