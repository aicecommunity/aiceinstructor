// app/services/courses.ts

import { api } from "./api";
import type { Course, CoursePayload, SlugAvailability } from "../types/course";

export const courses = {
  list: () => api.get<Course[]>("/courses/"),

  get: (id: number) => api.get<Course>(`/courses/${id}/`),

  create: (data: CoursePayload) => api.post<Course>("/courses/", data),

  update: (id: number, data: CoursePayload) =>
    api.put<Course>(`/courses/${id}/`, data),

  delete: (id: number) => api.delete(`/courses/${id}/`),

  slugAvailable: (slug: string) =>
    api.get<SlugAvailability>("/courses/slug_available/", {
      params: { slug },
    }),
};
