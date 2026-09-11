// app/services/administrators.ts
// Administrator registry — superuser-only (/api/courses/administrators/).

import { api } from "./api";
import { hasFile, toFormData, toJSON, multipartHeaders } from "./http";
import type { Administrator, AdministratorPayload, AdministratorCandidate } from "../types/course";

export const administrators = {
  list: () => api.get<Administrator[]>("/courses/administrators/"),
  create: (data: AdministratorPayload) =>
    hasFile(data)
      ? api.post<Administrator>("/courses/administrators/", toFormData(data), multipartHeaders())
      : api.post<Administrator>("/courses/administrators/", toJSON(data)),
  update: (id: number, data: AdministratorPayload) =>
    hasFile(data)
      ? api.put<Administrator>(`/courses/administrators/${id}/`, toFormData(data), multipartHeaders())
      : api.put<Administrator>(`/courses/administrators/${id}/`, toJSON(data)),
  delete: (id: number) => api.delete(`/courses/administrators/${id}/`),

  // Superuser-only: search registered users for the picker. People currently in
  // the Instructors registry are included — picking one moves them here.
  searchCandidates: (q: string) =>
    api.get<AdministratorCandidate[]>("/profiles/administrator-candidates/", {
      params: { q },
    }),
};