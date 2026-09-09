// app/store/useStudentsStore.ts
// Zustand store for the learners/records + submission-review screen.
//
// All data now comes from the real backend:
//  - GET  /api/cohorts/{id}/progress/          aggregate cohort progress
//  - GET  /api/cohorts/{id}/records/           roster + per-learner records
//  - GET  /api/assessment/submissions/{id}/    single submission review
//  - PATCH /api/assessment/submissions/{id}/   instructor grade override
//
// State is keyed per cohort id. Only aiceinstructor/ is touched.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { cohorts as cohortsService } from "../services/cohorts";
import { students as studentsService } from "../services/students";
import type { CohortProgress, LearnerRecord, PracticalSubmission, GradingOverridePayload } from "../types/records";

function errMsg(err: any, fallback: string): string {
  return err?.message || err?.response?.data?.detail || fallback;
}

export interface RecordContext {
  cohortId: number;
  cohortName: string;
  courseSlug: string;
  courseTitle: string;
}

interface CohortRecordsState {
  // REAL data per cohort
  progress: CohortProgress | null;
  progressError: string | null;
  isLoadingProgress: boolean;

  records: LearnerRecord[];
  recordsError: string | null;
  isLoadingRecords: boolean;

  isOverriding: boolean;
  overrideError: string | null;

  fetchProgress: (cohortId: number) => Promise<void>;
  fetchRecords: (ctx: RecordContext) => Promise<void>;

  getSubmission: (cohortId: number, submissionId: number) => Promise<PracticalSubmission | null>;
  overrideSubmission: (cohortId: number, payload: GradingOverridePayload) => Promise<PracticalSubmission | null>;

  clear: () => void;
}

export const useStudentsStore = create<CohortRecordsState>((set) => ({
  progress: null,
  progressError: null,
  isLoadingProgress: false,

  records: [],
  recordsError: null,
  isLoadingRecords: false,

  isOverriding: false,
  overrideError: null,

  clear: () =>
    set({
      progress: null,
      progressError: null,
      isLoadingProgress: false,
      records: [],
      recordsError: null,
      isLoadingRecords: false,
      overrideError: null,
    }),

  fetchProgress: async (cohortId) => {
    set({ isLoadingProgress: true, progressError: null });
    try {
      const { data } = await cohortsService.progress(cohortId);
      set({ progress: data, isLoadingProgress: false });
    } catch (err: any) {
      set({
        progressError: errMsg(err, "Failed to load cohort progress"),
        isLoadingProgress: false,
      });
    }
  },

  fetchRecords: async (ctx) => {
    set({ isLoadingRecords: true, recordsError: null });
    try {
      const { data } = await studentsService.records(ctx.cohortId);
      set({ records: data.records, isLoadingRecords: false });
    } catch (err: any) {
      set({
        recordsError: errMsg(err, "Failed to load learner records"),
        isLoadingRecords: false,
      });
    }
  },

  getSubmission: async (_cohortId, submissionId) => {
    try {
      const { data } = await studentsService.submission(submissionId);
      return data;
    } catch {
      return null;
    }
  },

  overrideSubmission: async (cohortId, payload) => {
    set({ isOverriding: true, overrideError: null });
    try {
      const { data } = await studentsService.gradeSubmission(payload.submission_id, payload);
      set((s) => ({
        records: s.records.map((r) => ({
          ...r,
          practical_submissions: r.practical_submissions.map((sub) =>
            sub.id === payload.submission_id ? data : sub
          ),
        })),
        isOverriding: false,
      }));
      return data;
    } catch (err: any) {
      set({
        overrideError: errMsg(err, "Failed to apply override"),
        isOverriding: false,
      });
      return null;
    }
  },
}));