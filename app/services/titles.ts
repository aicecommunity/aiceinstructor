// app/services/titles.ts
// Administrator title registry — superuser-only (/api/courses/titles/).

import { api } from "./api";
import type { AdministratorTitle, AdministratorTitlePayload } from "../types/course";

export const titles = {
  list: () => api.get<AdministratorTitle[]>("/courses/titles/"),
  create: (data: AdministratorTitlePayload) =>
    api.post<AdministratorTitle>("/courses/titles/", data),
  update: (id: number, data: AdministratorTitlePayload) =>
    api.put<AdministratorTitle>(`/courses/titles/${id}/`, data),
  delete: (id: number) => api.delete(`/courses/titles/${id}/`),
};
