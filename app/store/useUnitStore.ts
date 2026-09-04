// app/store/useUnitStore.ts
// Zustand store for CalendarUnit / CalendarUnitContent authoring, scoped to a
// chosen enrollment's ProgramCalendar. Currently backed ONLY by mock data
// (lib/mock/mockApi.ts) because the real curriculum endpoints are read-only.
// When real endpoints land, flip USE_MOCK and swap the calls — components stay.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { mockApi } from "../../lib/mock/mockApi";
import type {
  CalendarUnit,
  CalendarUnitContent,
  CalendarUnitContentPayload,
  CalendarUnitPayload,
  ProgramCalendar,
} from "../types/curriculum";

const USE_MOCK = true;

interface UnitState {
  enrollmentId: number | null;
  calendar: ProgramCalendar | null;
  units: CalendarUnit[];

  isLoadingCalendar: boolean;
  calendarError: string | null;

  isSavingUnit: boolean;
  unitSaveError: string | null;

  isSavingContent: boolean;
  contentSaveError: string | null;

  selectEnrollment: (enrollmentId: number) => void;
  fetchCalendar: (enrollmentId: number) => Promise<void>;

  createUnit: (enrollmentId: number, payload: CalendarUnitPayload) => Promise<CalendarUnit | null>;
  updateUnit: (enrollmentId: number, unitId: number, payload: CalendarUnitPayload) => Promise<CalendarUnit | null>;
  deleteUnit: (enrollmentId: number, unitId: number) => Promise<void>;

  createContent: (
    enrollmentId: number,
    unitId: number,
    payload: CalendarUnitContentPayload
  ) => Promise<CalendarUnitContent | null>;
  updateContent: (
    enrollmentId: number,
    unitId: number,
    contentId: number,
    payload: CalendarUnitContentPayload
  ) => Promise<CalendarUnitContent | null>;
  deleteContent: (enrollmentId: number, unitId: number, contentId: number) => Promise<void>;

  moveContent: (
    enrollmentId: number,
    unitId: number,
    contentId: number,
    direction: -1 | 1
  ) => Promise<void>;
}

function errMsg(err: any, fallback: string): string {
  return err?.message || err?.response?.data?.detail || fallback;
}

function applyCalendar(state: UnitState, calendar: ProgramCalendar | null): Partial<UnitState> {
  return {
    calendar,
    units: (calendar?.units ?? []).slice().sort((a, b) => a.order - b.order),
  };
}

export const useUnitStore = create<UnitState>((set) => ({
  enrollmentId: null,
  calendar: null,
  units: [],

  isLoadingCalendar: false,
  calendarError: null,

  isSavingUnit: false,
  unitSaveError: null,

  isSavingContent: false,
  contentSaveError: null,

  selectEnrollment: (enrollmentId) => set({ enrollmentId }),

  fetchCalendar: async (enrollmentId: number) => {
    set({ enrollmentId, isLoadingCalendar: true, calendarError: null });
    try {
      const { data } = USE_MOCK
        ? await mockApi.curriculum.getCalendar(enrollmentId)
        : await Promise.reject(new Error("Real endpoint not implemented"));
      set((s) => ({ ...applyCalendar(s, data), isLoadingCalendar: false }));
    } catch (err: any) {
      set({
        calendarError: errMsg(err, "Failed to load calendar"),
        isLoadingCalendar: false,
      });
    }
  },

  createUnit: async (enrollmentId, payload) => {
    set({ isSavingUnit: true, unitSaveError: null });
    try {
      const { data } = USE_MOCK
        ? await mockApi.curriculum.createUnit(enrollmentId, payload)
        : await Promise.reject(new Error("Real endpoint not implemented"));
      set((s) => {
        const calendar = s.calendar
          ? { ...s.calendar, units: [...(s.calendar.units ?? []), data] }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingUnit: false };
      });
      return data;
    } catch (err: any) {
      set({ unitSaveError: errMsg(err, "Failed to save unit"), isSavingUnit: false });
      return null;
    }
  },

  updateUnit: async (enrollmentId, unitId, payload) => {
    set({ isSavingUnit: true, unitSaveError: null });
    try {
      const { data } = USE_MOCK
        ? await mockApi.curriculum.updateUnit(enrollmentId, unitId, payload)
        : await Promise.reject(new Error("Real endpoint not implemented"));
      set((s) => {
        const calendar = s.calendar
          ? {
              ...s.calendar,
              units: (s.calendar.units ?? []).map((u) => (u.id === unitId ? data : u)),
            }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingUnit: false };
      });
      return data;
    } catch (err: any) {
      set({ unitSaveError: errMsg(err, "Failed to save unit"), isSavingUnit: false });
      return null;
    }
  },

  deleteUnit: async (enrollmentId, unitId) => {
    set({ isSavingUnit: true, unitSaveError: null });
    try {
      if (USE_MOCK) {
        await mockApi.curriculum.deleteUnit(enrollmentId, unitId);
      }
      set((s) => {
        const calendar = s.calendar
          ? { ...s.calendar, units: (s.calendar.units ?? []).filter((u) => u.id !== unitId) }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingUnit: false };
      });
    } catch (err: any) {
      set({ unitSaveError: errMsg(err, "Failed to delete unit"), isSavingUnit: false });
    }
  },

  createContent: async (enrollmentId, unitId, payload) => {
    set({ isSavingContent: true, contentSaveError: null });
    try {
      const { data } = USE_MOCK
        ? await mockApi.curriculum.createContent(enrollmentId, unitId, payload)
        : await Promise.reject(new Error("Real endpoint not implemented"));
      set((s) => {
        const calendar = s.calendar
          ? {
              ...s.calendar,
              units: (s.calendar.units ?? []).map((u) =>
                u.id === unitId ? { ...u, contents: [...u.contents, data] } : u
              ),
            }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingContent: false };
      });
      return data;
    } catch (err: any) {
      set({ contentSaveError: errMsg(err, "Failed to save content"), isSavingContent: false });
      return null;
    }
  },

  updateContent: async (enrollmentId, unitId, contentId, payload) => {
    set({ isSavingContent: true, contentSaveError: null });
    try {
      const { data } = USE_MOCK
        ? await mockApi.curriculum.updateContent(enrollmentId, unitId, contentId, payload)
        : await Promise.reject(new Error("Real endpoint not implemented"));
      set((s) => {
        const calendar = s.calendar
          ? {
              ...s.calendar,
              units: (s.calendar.units ?? []).map((u) =>
                u.id === unitId
                  ? { ...u, contents: u.contents.map((c) => (c.id === contentId ? data : c)) }
                  : u
              ),
            }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingContent: false };
      });
      return data;
    } catch (err: any) {
      set({ contentSaveError: errMsg(err, "Failed to save content"), isSavingContent: false });
      return null;
    }
  },

  deleteContent: async (enrollmentId, unitId, contentId) => {
    set({ isSavingContent: true, contentSaveError: null });
    try {
      if (USE_MOCK) {
        await mockApi.curriculum.deleteContent(enrollmentId, unitId, contentId);
      }
      set((s) => {
        const calendar = s.calendar
          ? {
              ...s.calendar,
              units: (s.calendar.units ?? []).map((u) =>
                u.id === unitId
                  ? { ...u, contents: u.contents.filter((c) => c.id !== contentId) }
                  : u
              ),
            }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingContent: false };
      });
    } catch (err: any) {
      set({ contentSaveError: errMsg(err, "Failed to delete content"), isSavingContent: false });
    }
  },

  moveContent: async (enrollmentId, unitId, contentId, direction) => {
    set({ isSavingContent: true, contentSaveError: null });
    try {
      let contents: CalendarUnitContent[] = [];
      if (USE_MOCK) {
        const { data } = await mockApi.curriculum.moveContent(enrollmentId, unitId, contentId, direction);
        contents = data;
      }
      set((s) => {
        const calendar = s.calendar
          ? {
              ...s.calendar,
              units: (s.calendar.units ?? []).map((u) =>
                u.id === unitId ? { ...u, contents } : u
              ),
            }
          : s.calendar;
        return { ...applyCalendar(s, calendar), isSavingContent: false };
      });
    } catch (err: any) {
      set({ contentSaveError: errMsg(err, "Failed to reorder content"), isSavingContent: false });
    }
  },
}));
