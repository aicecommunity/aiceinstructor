// app/store/useInstructorStore.ts
// Real-data store: talks only to the live /api/courses/instructors/ endpoints.
// No USE_MOCK flag (per convention: absence ⇒ real).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { instructors as instructorsService } from "../services/instructors";
import type { Instructor, InstructorPayload } from "../types/course";

interface InstructorState {
  instructors: Instructor[];

  isLoadingInstructors: boolean;
  instructorsError: string | null;

  isSavingInstructor: boolean;
  instructorSaveError: string | null;

  fetchInstructors: () => Promise<void>;
  createInstructor: (data: InstructorPayload) => Promise<Instructor | null>;
  updateInstructor: (id: number, data: InstructorPayload) => Promise<Instructor | null>;
  deleteInstructor: (id: number) => Promise<void>;
}

export const useInstructorStore = create<InstructorState>((set) => ({
  instructors: [],

  isLoadingInstructors: false,
  instructorsError: null,

  isSavingInstructor: false,
  instructorSaveError: null,

  fetchInstructors: async () => {
    set({ isLoadingInstructors: true, instructorsError: null });
    try {
      const { data } = await instructorsService.list();
      set({ instructors: data, isLoadingInstructors: false });
    } catch (err: any) {
      set({
        instructorsError:
          err?.response?.data?.detail || err?.message || "Failed to load instructors",
        isLoadingInstructors: false,
      });
    }
  },

  createInstructor: async (data: InstructorPayload) => {
    set({ isSavingInstructor: true, instructorSaveError: null });
    try {
      const { data: created } = await instructorsService.create(data);
      set((s) => ({
        instructors: [...s.instructors, created],
        isSavingInstructor: false,
      }));
      return created;
    } catch (err: any) {
      set({ instructorSaveError: formatFieldErrors(err), isSavingInstructor: false });
      return null;
    }
  },

  updateInstructor: async (id: number, data: InstructorPayload) => {
    set({ isSavingInstructor: true, instructorSaveError: null });
    try {
      const { data: updated } = await instructorsService.update(id, data);
      set((s) => ({
        instructors: s.instructors.map((i) => (i.id === id ? updated : i)),
        isSavingInstructor: false,
      }));
      return updated;
    } catch (err: any) {
      set({ instructorSaveError: formatFieldErrors(err), isSavingInstructor: false });
      return null;
    }
  },

  deleteInstructor: async (id: number) => {
    try {
      await instructorsService.delete(id);
      set((s) => ({
        instructors: s.instructors.filter((i) => i.id !== id),
      }));
    } catch {
      // surface via error state if needed
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
