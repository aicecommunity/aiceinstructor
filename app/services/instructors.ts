// app/services/instructors.ts

import { api } from "./api";
import { hasFile, toFormData, toJSON, multipartHeaders } from "./http";
import type { Instructor, InstructorCandidate, InstructorPayload } from "../types/course";

export const instructors = {
  list: () => api.get<Instructor[]>("/courses/instructors/"),

  // Superuser-only: search registered users by name/email for the picker.
  searchCandidates: (q: string) =>
    api.get<InstructorCandidate[]>("/profiles/instructor-candidates/", {
      params: { q },
    }),

  create: (data: InstructorPayload) =>
    hasFile(data)
      ? api.post<Instructor>("/courses/instructors/", toFormData(data), multipartHeaders())
      : api.post<Instructor>("/courses/instructors/", toJSON(data)),

  update: (id: number, data: InstructorPayload) =>
    hasFile(data)
      ? api.put<Instructor>(`/courses/instructors/${id}/`, toFormData(data), multipartHeaders())
      : api.put<Instructor>(`/courses/instructors/${id}/`, toJSON(data)),

  delete: (id: number) => api.delete(`/courses/instructors/${id}/`),
};
