// app/store/useTitleStore.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { titles as titlesService } from "../services/titles";
import type { AdministratorTitle, AdministratorTitlePayload } from "../types/course";

interface TitleState {
  titles: AdministratorTitle[];
  isLoadingTitles: boolean;
  titlesError: string | null;

  isSavingTitle: boolean;
  titleSaveError: string | null;
  isDeletingTitle: boolean;

  fetchTitles: () => Promise<void>;
  createTitle: (data: AdministratorTitlePayload) => Promise<AdministratorTitle | null>;
  updateTitle: (id: number, data: AdministratorTitlePayload) => Promise<AdministratorTitle | null>;
  deleteTitle: (id: number) => Promise<boolean>;
}

export const useTitleStore = create<TitleState>((set) => ({
  titles: [],
  isLoadingTitles: false,
  titlesError: null,

  isSavingTitle: false,
  titleSaveError: null,
  isDeletingTitle: false,

  fetchTitles: async () => {
    set({ isLoadingTitles: true, titlesError: null });
    try {
      const { data } = await titlesService.list();
      set({ titles: data, isLoadingTitles: false });
    } catch (err: any) {
      set({
        titlesError: err?.response?.data?.detail || err?.message || "Failed to load titles",
        isLoadingTitles: false,
      });
    }
  },

  createTitle: async (data: AdministratorTitlePayload) => {
    set({ isSavingTitle: true, titleSaveError: null });
    try {
      const { data: created } = await titlesService.create(data);
      set((s) => ({ titles: [...s.titles, created].sort((a, b) => a.order - b.order), isSavingTitle: false }));
      return created;
    } catch (err: any) {
      set({ titleSaveError: formatFieldErrors(err), isSavingTitle: false });
      return null;
    }
  },

  updateTitle: async (id: number, data: AdministratorTitlePayload) => {
    set({ isSavingTitle: true, titleSaveError: null });
    try {
      const { data: updated } = await titlesService.update(id, data);
      set((s) => ({
        titles: s.titles.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.order - b.order),
        isSavingTitle: false,
      }));
      return updated;
    } catch (err: any) {
      set({ titleSaveError: formatFieldErrors(err), isSavingTitle: false });
      return null;
    }
  },

  deleteTitle: async (id: number) => {
    set({ isDeletingTitle: true });
    try {
      await titlesService.delete(id);
      set((s) => ({ titles: s.titles.filter((t) => t.id !== id), isDeletingTitle: false }));
      return true;
    } catch {
      set({ isDeletingTitle: false });
      return false;
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
      if (Array.isArray(value)) parts.push(`${field}: ${value.join(", ")}`);
      else if (value) parts.push(`${field}: ${String(value)}`);
    });
    return parts.join("; ");
  }
  return err?.message || "Request failed";
}
