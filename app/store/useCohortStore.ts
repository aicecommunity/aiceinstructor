// app/store/useCohortStore.ts
// Read-only real-data store for /api/cohorts/.
// No USE_MOCK flag (per convention: absence ⇒ real).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { cohorts as cohortsService } from "../services/cohorts";
import type { Cohort, CohortMember, PaginatedResults } from "../types/enrollment";

interface CohortState {
  cohorts: Cohort[];
  selectedCohortCohorts: Cohort[];
  members: CohortMember[];
  membersCount: number;
  membersNext: string | null;

  isLoadingCohorts: boolean;
  cohortsError: string | null;

  isLoadingMembers: boolean;
  membersError: string | null;

  fetchCohorts: () => Promise<void>;
  fetchCohortsByEnrollment: (enrollmentId: number) => Promise<void>;
  fetchMembers: (cohortId: number, page?: number, pageSize?: number, search?: string) => Promise<void>;
}

export const useCohortStore = create<CohortState>((set) => ({
  cohorts: [],
  selectedCohortCohorts: [],
  members: [],
  membersCount: 0,
  membersNext: null,

  isLoadingCohorts: false,
  cohortsError: null,

  isLoadingMembers: false,
  membersError: null,

  fetchCohorts: async () => {
    set({ isLoadingCohorts: true, cohortsError: null });
    try {
      const { data } = await cohortsService.list();
      set({ cohorts: data, isLoadingCohorts: false });
    } catch (err: any) {
      set({
        cohortsError: err?.response?.data?.detail || err?.message || "Failed to load cohorts",
        isLoadingCohorts: false,
      });
    }
  },

  fetchCohortsByEnrollment: async (enrollmentId: number) => {
    set({ isLoadingCohorts: true, cohortsError: null });
    try {
      const { data } = await cohortsService.listByEnrollment(enrollmentId);
      set({ selectedCohortCohorts: data, isLoadingCohorts: false });
    } catch (err: any) {
      set({
        cohortsError:
          err?.response?.data?.detail || err?.message || "Failed to load cohorts for enrollment",
        isLoadingCohorts: false,
      });
    }
  },

  fetchMembers: async (cohortId: number, page = 1, pageSize = 50, search = "") => {
    set({ isLoadingMembers: true, membersError: null });
    try {
      const { data } = await cohortsService.members(cohortId, page, pageSize, search);
      const results: CohortMember[] = Array.isArray(data) ? data : (data as PaginatedResults<CohortMember>).results;
      const count = Array.isArray(data) ? results.length : (data as PaginatedResults<CohortMember>).count;
      const next = Array.isArray(data) ? null : (data as PaginatedResults<CohortMember>).next;
      set({
        members: results,
        membersCount: count,
        membersNext: next,
        isLoadingMembers: false,
      });
    } catch (err: any) {
      set({
        membersError:
          err?.response?.data?.detail || err?.message || "Failed to load cohort members",
        isLoadingMembers: false,
      });
    }
  },
}));
