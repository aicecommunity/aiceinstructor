// app/services/instructors.ts

import { api } from "./api";
import type { Instructor, InstructorCandidate, InstructorPayload } from "../types/course";

export const instructors = {
  list: () => api.get<Instructor[]>("/courses/instructors/"),

  // Superuser-only: search registered users by name/email for the picker.
  searchCandidates: (q: string) =>
    api.get<InstructorCandidate[]>("/profiles/instructor-candidates/", {
      params: { q },
    }),

  create: (data: InstructorPayload) =>
    api.post<Instructor>("/courses/instructors/", data),

  update: (id: number, data: InstructorPayload) =>
    api.put<Instructor>(`/courses/instructors/${id}/`, data),

  delete: (id: number) => api.delete(`/courses/instructors/${id}/`),
};
