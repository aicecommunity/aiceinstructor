// app/services/certificates.ts — certificate signatories, template images &
// per-course assignments. All endpoints are superuser-only.

import { api } from "./api";
import { multipartHeaders } from "./http";
import type {
  Signatory,
  CertificateCourse,
  AssignSignatoriesRequest,
  CertificateTemplate,
  CertificateTemplatePayload,
} from "../types/certificates";

function templateToFormData(data: CertificateTemplatePayload): FormData {
  const fd = new FormData();
  fd.append("name", data.name);
  fd.append("signature_type", data.signature_type);
  fd.append("is_active", String(data.is_active));
  if (data.image instanceof File) fd.append("image", data.image);
  return fd;
}

function templateBody(data: CertificateTemplatePayload): FormData | Record<string, unknown> {
  // Always send multipart so an omitted image never wipes the existing file.
  return templateToFormData(data);
}

export const certificates = {
  // Certificate signatories (auto-synced from instructors/administrators) —
  // /api/certificates/signatories/ (read-only for the UI; used in assignment pickers)
  listSignatories: () => api.get<Signatory[]>("/certificates/signatories/"),

  // Certificate template images — /api/certificates/templates/
  listTemplates: () => api.get<CertificateTemplate[]>("/certificates/templates/"),
  createTemplate: (data: CertificateTemplatePayload) =>
    api.post<CertificateTemplate>("/certificates/templates/", templateBody(data), multipartHeaders()),
  updateTemplate: (id: number, data: CertificateTemplatePayload) =>
    api.put<CertificateTemplate>(`/certificates/templates/${id}/`, templateBody(data), multipartHeaders()),
  deleteTemplate: (id: number) => api.delete(`/certificates/templates/${id}/`),

  // Courses with assigned signatories — /api/certificates/courses/
  listCourses: () => api.get<CertificateCourse[]>("/certificates/courses/"),
  assignSignatories: (
    courseId: number,
    data: AssignSignatoriesRequest,
  ) =>
    api.put<CertificateCourse>(`/certificates/courses/${courseId}/signatories/`, data),
};