// app/store/useStudentsStore.ts
// Zustand store for the learners/records + submission-review screen.
//
// Hybrid by design (mirrors what is genuinely readable vs what must be mocked):
//  - REAL: cohort aggregate progress via GET /api/cohorts/{id}/progress/
//    (CohortProgressView — the only instructor-viewable aggregate read today).
//  - MOCK: the per-learner roster + completion/quiz/practical status and the
//    submission-review payloads + instructor override. No instructor-scoped
//    aggregate read or write exists (every assessment endpoint is learner-"me"-
//    scoped), and the real cohort-members endpoint returns empty (role="student"
//    never matches Profile.role). So USE_MOCK covers those.
//
// State is keyed per cohort id. Only aiceinstructor/ is touched.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { cohorts as cohortsService } from "../services/cohorts";
import { mockApi } from "../../lib/mock/mockApi";
import type { CohortProgress, LearnerRecord, PracticalSubmission, GradingOverridePayload } from "../types/records";

const USE_MOCK_RECORDS = true;

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

  // MOCK data per cohort
  records: LearnerRecord[];
  recordsError: string | null;
  isLoadingRecords: boolean;

  // MOCK submission review (+ override, proposal only)
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
      // REAL endpoint.
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
      if (!USE_MOCK_RECORDS) {
        set({ recordsError: "No instructor records endpoint implemented.", isLoadingRecords: false });
        return;
      }
      const { data } = await mockApi.students.listRecords(ctx);
      set({ records: data, isLoadingRecords: false });
    } catch (err: any) {
      set({
        recordsError: errMsg(err, "Failed to load learner records"),
        isLoadingRecords: false,
      });
    }
  },

  getSubmission: async (cohortId, submissionId) => {
    try {
      if (!USE_MOCK_RECORDS) return null;
      const { data } = await mockApi.students.getSubmission(cohortId, submissionId);
      return data;
    } catch {
      return null;
    }
  },

  overrideSubmission: async (cohortId, payload) => {
    set({ isOverriding: true, overrideError: null });
    try {
      if (!USE_MOCK_RECORDS) {
        set({ overrideError: "No grading override endpoint implemented.", isOverriding: false });
        return null;
      }
      const { data } = await mockApi.students.overrideSubmission(cohortId, payload);
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
