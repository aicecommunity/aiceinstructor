// app/services/courses.ts

import { api } from "./api";
import type { Course, CoursePayload, SlugAvailability } from "../types/course";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export function hasCourseImage(payload: CoursePayload): boolean {
  return payload.image instanceof File;
}

// JSON variant that strips an empty image so a null/omitted value can never
// wipe the existing image on edit.
export function courseToJSON(payload: CoursePayload) {
  const { image, ...rest } = payload;
  void image;
  return rest;
}

export function courseToFormData(payload: CoursePayload): FormData {
  const fd = new FormData();
  fd.append("slug", payload.slug);
  fd.append("title", payload.title);
  fd.append("description", payload.description);
  fd.append("duration_weeks", String(payload.duration_weeks));
  fd.append("certificates", JSON.stringify(payload.certificates));
  fd.append("is_active", String(payload.is_active));
  if (payload.is_paid != null) fd.append("is_paid", String(payload.is_paid));
  if (payload.price != null) fd.append("price", String(payload.price));
  if (payload.currency) fd.append("currency", payload.currency);
  if (payload.group_link) fd.append("group_link", payload.group_link);
  if (payload.image instanceof File) fd.append("image", payload.image);
  return fd;
}

export const courses = {
  list: () => api.get<Course[]>("/courses/"),

  get: (id: number) => api.get<Course>(`/courses/${id}/`),

  create: (data: CoursePayload) =>
    api.post<Course>(
      "/courses/",
      hasCourseImage(data) ? courseToFormData(data) : courseToJSON(data),
      hasCourseImage(data) ? MULTIPART : undefined,
    ),

  update: (id: number, data: CoursePayload) =>
    api.put<Course>(
      `/courses/${id}/`,
      hasCourseImage(data) ? courseToFormData(data) : courseToJSON(data),
      hasCourseImage(data) ? MULTIPART : undefined,
    ),

  delete: (id: number) => api.delete(`/courses/${id}/`),

  slugAvailable: (slug: string) =>
    api.get<SlugAvailability>("/courses/slug_available/", {
      params: { slug },
    }),
};
