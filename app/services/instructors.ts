// app/services/instructors.ts

import { api } from "./api";
import type { Instructor, InstructorPayload } from "../types/course";

export const instructors = {
  list: () => api.get<Instructor[]>("/courses/instructors/"),

  create: (data: InstructorPayload) =>
    api.post<Instructor>("/courses/instructors/", data),

  update: (id: number, data: InstructorPayload) =>
    api.put<Instructor>(`/courses/instructors/${id}/`, data),

  delete: (id: number) => api.delete(`/courses/instructors/${id}/`),
};
