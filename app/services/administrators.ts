// app/services/administrators.ts
// Administrator registry — superuser-only (/api/courses/administrators/).

import { api } from "./api";
import { hasFile, toFormData, toJSON, multipartHeaders } from "./http";
import type { Administrator, AdministratorPayload } from "../types/course";

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
};