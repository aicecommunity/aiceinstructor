// app/store/useCourseStore.ts
// Real-data store: talks only to the live /api/courses/ endpoints.
// No USE_MOCK flag (per convention: absence ⇒ real).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { courses as coursesService } from "../services/courses";
import type { Course, CoursePayload } from "../types/course";

interface CourseState {
  courses: Course[];
  current: Course | null;

  isLoadingCourses: boolean;
  coursesError: string | null;

  isSavingCourse: boolean;
  courseSaveError: string | null;

  isDeletingCourse: boolean;

  fetchCourses: () => Promise<void>;
  fetchCourse: (id: number) => Promise<void>;
  createCourse: (data: CoursePayload) => Promise<Course | null>;
  updateCourse: (id: number, data: CoursePayload) => Promise<Course | null>;
  deleteCourse: (id: number) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  current: null,

  isLoadingCourses: false,
  coursesError: null,

  isSavingCourse: false,
  courseSaveError: null,

  isDeletingCourse: false,

  fetchCourses: async () => {
    set({ isLoadingCourses: true, coursesError: null });
    try {
      const { data } = await coursesService.list();
      set({ courses: data, isLoadingCourses: false });
    } catch (err: any) {
      set({
        coursesError: err?.response?.data?.detail || err?.message || "Failed to load courses",
        isLoadingCourses: false,
      });
    }
  },

  fetchCourse: async (id: number) => {
    set({ isLoadingCourses: true, coursesError: null });
    try {
      const { data } = await coursesService.get(id);
      set({ current: data, isLoadingCourses: false });
    } catch (err: any) {
      set({
        coursesError: err?.response?.data?.detail || err?.message || "Failed to load course",
        isLoadingCourses: false,
      });
    }
  },

  createCourse: async (data: CoursePayload) => {
    set({ isSavingCourse: true, courseSaveError: null });
    try {
      const { data: created } = await coursesService.create(data);
      set((s) => ({ courses: [...s.courses, created], isSavingCourse: false }));
      return created;
    } catch (err: any) {
      set({
        courseSaveError: formatFieldErrors(err),
        isSavingCourse: false,
      });
      return null;
    }
  },

  updateCourse: async (id: number, data: CoursePayload) => {
    set({ isSavingCourse: true, courseSaveError: null });
    try {
      const { data: updated } = await coursesService.update(id, data);
      set((s) => ({
        courses: s.courses.map((c) => (c.id === id ? updated : c)),
        current: updated,
        isSavingCourse: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        courseSaveError: formatFieldErrors(err),
        isSavingCourse: false,
      });
      return null;
    }
  },

  deleteCourse: async (id: number) => {
    set({ isDeletingCourse: true });
    try {
      await coursesService.delete(id);
      set((s) => ({
        courses: s.courses.filter((c) => c.id !== id),
        isDeletingCourse: false,
      }));
    } catch {
      set({ isDeletingCourse: false });
    }
  },
}));

function formatFieldErrors(err: any): string {
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (typeof data.detail === "string") return data.detail;
    const parts: string[] = [];
    Object.entries(data).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        parts.push(`${field}: ${value.join(", ")}`);
      } else if (value) {
        parts.push(`${field}: ${String(value)}`);
      }
    });
    return parts.join("; ");
  }
  return err?.message || "Request failed";
}
