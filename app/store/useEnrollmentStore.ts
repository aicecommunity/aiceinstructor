// app/store/useEnrollmentStore.ts
// Read-only real-data store for /api/enrollments/.
// No USE_MOCK flag (per convention: absence ⇒ real).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { enrollments as enrollmentsService } from "../services/enrollments";
import type { Enrollment } from "../types/enrollment";

interface EnrollmentState {
  enrollments: Enrollment[];

  isLoadingEnrollments: boolean;
  enrollmentsError: string | null;

  // Shared, app-wide selection context (prompt 08). The currently-selected
  // enrollment (and optional cohort) is held here so dependent screens — Units
  // (05/06) and Student Records (07) — inherit it instead of making the user
  // re-pick context on every screen.
  selectedEnrollmentId: number | null;
  selectedCohortId: number | null;

  fetchEnrollments: () => Promise<void>;
  selectEnrollment: (id: number) => void;
  selectCohort: (id: number | null) => void;
}

export const useEnrollmentStore = create<EnrollmentState>((set) => ({
  enrollments: [],

  isLoadingEnrollments: false,
  enrollmentsError: null,

  selectedEnrollmentId: null,
  selectedCohortId: null,

  fetchEnrollments: async () => {
    set({ isLoadingEnrollments: true, enrollmentsError: null });
    try {
      const { data } = await enrollmentsService.list();
      set({ enrollments: data, isLoadingEnrollments: false });
    } catch (err: any) {
      set({
        enrollmentsError:
          err?.response?.data?.detail || err?.message || "Failed to load enrollments",
        isLoadingEnrollments: false,
      });
    }
  },

  selectEnrollment: (id) => set({ selectedEnrollmentId: id }),
  selectCohort: (id) => set({ selectedCohortId: id }),
}));