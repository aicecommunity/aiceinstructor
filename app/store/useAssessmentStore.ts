// app/store/useAssessmentStore.ts
// Zustand store for CalendarUnitAssessment / QuizQuestion / PracticalQuestion
// authoring, scoped per unit (keyed by unit id). Backed by real backend
// authoring endpoints (app/services/assessment.ts).
//
// Context threading: enrollment + unit context (prompts 04/05) is passed into the
// actions (unit carries `order`; courseSlug/enrollmentId come from the calendar)
// so codes like `aice-sef_quiz_unit3_1` are generated without manual ID entry.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { assessment } from "../services/assessment";
import { mockApi } from "../../lib/mock/mockApi";
import type { CalendarUnit } from "../types/curriculum";
import type {
  CalendarUnitAssessment,
  AssessmentPayload,
  QuizQuestion,
  QuizQuestionPayload,
  PracticalQuestion,
  PracticalQuestionPayload,
} from "../types/assessment";

const USE_MOCK = false;

function errMsg(err: any, fallback: string): string {
  return err?.message || err?.response?.data?.detail || fallback;
}

interface UnitAssessmentSlice {
  assessment: CalendarUnitAssessment | null;
  quizQuestions: QuizQuestion[];
  practicalQuestions: PracticalQuestion[];

  isLoading: boolean;
  error: string | null;

  isSavingAssessment: boolean;
  assessmentSaveError: string | null;

  isSavingQuiz: boolean;
  quizSaveError: string | null;

  isSavingPractical: boolean;
  practicalSaveError: string | null;
}

const emptySlice = (): UnitAssessmentSlice => ({
  assessment: null,
  quizQuestions: [],
  practicalQuestions: [],
  isLoading: false,
  error: null,
  isSavingAssessment: false,
  assessmentSaveError: null,
  isSavingQuiz: false,
  quizSaveError: null,
  isSavingPractical: false,
  practicalSaveError: null,
});

interface AssessmentStoreState {
  byUnit: Record<number, UnitAssessmentSlice>;

  loadAssessment: (unit: CalendarUnit) => Promise<void>;

  setAssessment: (unit: CalendarUnit, payload: AssessmentPayload) => Promise<boolean>;
  removeAssessment: (unit: CalendarUnit) => Promise<void>;

  createQuiz: (unit: CalendarUnit, courseSlug: string, payload: QuizQuestionPayload) => Promise<boolean>;
  updateQuiz: (unit: CalendarUnit, questionId: number, payload: QuizQuestionPayload) => Promise<boolean>;
  deleteQuiz: (unit: CalendarUnit, questionId: number) => Promise<void>;

  createPractical: (
    unit: CalendarUnit,
    courseSlug: string,
    enrollmentId: number,
    payload: PracticalQuestionPayload
  ) => Promise<boolean>;
  updatePractical: (unit: CalendarUnit, questionId: number, payload: PracticalQuestionPayload) => Promise<boolean>;
  deletePractical: (unit: CalendarUnit, questionId: number) => Promise<void>;

  clearPracticalError: (unitId: number) => void;

  clearUnit: (unitId: number) => void;
}

function sliceOf(slices: Record<number, UnitAssessmentSlice>, unitId: number): UnitAssessmentSlice {
  return slices[unitId] ?? emptySlice();
}

export const useAssessmentStore = create<AssessmentStoreState>((set) => ({
  byUnit: {},

  clearUnit: (unitId) =>
    set((s) => {
      const next = { ...s.byUnit };
      delete next[unitId];
      return { byUnit: next };
    }),

  clearPracticalError: (unitId) =>
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), practicalSaveError: null },
      },
    })),

  loadAssessment: async (unit) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isLoading: true, error: null },
      },
    }));
    try {
      const [assessRes, quizRes, pracRes] = await Promise.all([
        USE_MOCK ? mockApi.assessment.getAssessment(unitId) : assessment.getAssessment(unitId),
        USE_MOCK ? mockApi.assessment.listQuiz(unitId) : assessment.listQuiz(unitId),
        USE_MOCK ? mockApi.assessment.listPractical(unitId) : assessment.listPractical(unitId),
      ]);
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            assessment: assessRes.data,
            quizQuestions: quizRes.data,
            practicalQuestions: pracRes.data,
            isLoading: false,
          },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            isLoading: false,
            error: errMsg(err, "Failed to load assessment"),
          },
        },
      }));
    }
  },

  setAssessment: async (unit, payload) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingAssessment: true, assessmentSaveError: null },
      },
    }));
    try {
      const { data } = USE_MOCK
        ? await mockApi.assessment.setAssessment(unitId, payload)
        : await assessment.setAssessment(unitId, payload);
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            assessment: data,
            isSavingAssessment: false,
          },
        },
      }));
      return true;
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            assessmentSaveError: errMsg(err, "Failed to save assessment"),
            isSavingAssessment: false,
          },
        },
      }));
      return false;
    }
  },

  removeAssessment: async (unit) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingAssessment: true, assessmentSaveError: null },
      },
    }));
    try {
      if (USE_MOCK) {
        await mockApi.assessment.deleteAssessment(unitId);
      } else {
        await assessment.removeAssessment(unitId);
      }
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            assessment: null,
            quizQuestions: [],
            practicalQuestions: [],
            isSavingAssessment: false,
          },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            assessmentSaveError: errMsg(err, "Failed to remove assessment"),
            isSavingAssessment: false,
          },
        },
      }));
    }
  },

  createQuiz: async (unit, courseSlug, payload) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingQuiz: true, quizSaveError: null },
      },
    }));
    try {
      const { data } = USE_MOCK
        ? await mockApi.assessment.createQuiz(unitId, courseSlug, unit.order, payload)
        : await assessment.createQuiz(unitId, payload);
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              quizQuestions: [...sl.quizQuestions, data],
              isSavingQuiz: false,
            },
          },
        };
      });
      return true;
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            quizSaveError: errMsg(err, "Failed to save quiz question"),
            isSavingQuiz: false,
          },
        },
      }));
      return false;
    }
  },

  updateQuiz: async (unit, questionId, payload) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingQuiz: true, quizSaveError: null },
      },
    }));
    try {
      const { data } = USE_MOCK
        ? await mockApi.assessment.updateQuiz(unitId, questionId, payload)
        : await assessment.updateQuiz(unitId, questionId, payload);
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              quizQuestions: sl.quizQuestions.map((q) => (q.id === questionId ? data : q)),
              isSavingQuiz: false,
            },
          },
        };
      });
      return true;
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            quizSaveError: errMsg(err, "Failed to save quiz question"),
            isSavingQuiz: false,
          },
        },
      }));
      return false;
    }
  },

  deleteQuiz: async (unit, questionId) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingQuiz: true, quizSaveError: null },
      },
    }));
    try {
      if (USE_MOCK) {
        await mockApi.assessment.deleteQuiz(unitId, questionId);
      } else {
        await assessment.deleteQuiz(unitId, questionId);
      }
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              quizQuestions: sl.quizQuestions.filter((q) => q.id !== questionId),
              isSavingQuiz: false,
            },
          },
        };
      });
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            quizSaveError: errMsg(err, "Failed to delete quiz question"),
            isSavingQuiz: false,
          },
        },
      }));
    }
  },

  createPractical: async (unit, courseSlug, enrollmentId, payload) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingPractical: true, practicalSaveError: null },
      },
    }));
    try {
      const { data } = USE_MOCK
        ? await mockApi.assessment.createPractical(unitId, courseSlug, unit.order, enrollmentId, payload)
        : await assessment.createPractical(unitId, payload);
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              practicalQuestions: [...sl.practicalQuestions, data],
              isSavingPractical: false,
            },
          },
        };
      });
      return true;
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            practicalSaveError: errMsg(err, "Failed to save practical question"),
            isSavingPractical: false,
          },
        },
      }));
      return false;
    }
  },

  updatePractical: async (unit, questionId, payload) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingPractical: true, practicalSaveError: null },
      },
    }));
    try {
      const { data } = USE_MOCK
        ? await mockApi.assessment.updatePractical(unitId, questionId, payload)
        : await assessment.updatePractical(unitId, questionId, payload);
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              practicalQuestions: sl.practicalQuestions.map((q) => (q.id === questionId ? data : q)),
              isSavingPractical: false,
            },
          },
        };
      });
      return true;
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            practicalSaveError: errMsg(err, "Failed to save practical question"),
            isSavingPractical: false,
          },
        },
      }));
      return false;
    }
  },

  deletePractical: async (unit, questionId) => {
    const unitId = unit.id;
    set((s) => ({
      byUnit: {
        ...s.byUnit,
        [unitId]: { ...sliceOf(s.byUnit, unitId), isSavingPractical: true, practicalSaveError: null },
      },
    }));
    try {
      if (USE_MOCK) {
        await mockApi.assessment.deletePractical(unitId, questionId);
      } else {
        await assessment.deletePractical(unitId, questionId);
      }
      set((s) => {
        const sl = sliceOf(s.byUnit, unitId);
        return {
          byUnit: {
            ...s.byUnit,
            [unitId]: {
              ...sl,
              practicalQuestions: sl.practicalQuestions.filter((q) => q.id !== questionId),
              isSavingPractical: false,
            },
          },
        };
      });
    } catch (err: any) {
      set((s) => ({
        byUnit: {
          ...s.byUnit,
          [unitId]: {
            ...sliceOf(s.byUnit, unitId),
            practicalSaveError: errMsg(err, "Failed to delete practical question"),
            isSavingPractical: false,
          },
        },
      }));
    }
  },
}));
