// app/store/useAdministratorStore.ts
// Administrator registry ("senior instructors") — superuser only.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { administrators as administratorsService } from "../services/administrators";
import type { Administrator, AdministratorPayload } from "../types/course";

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

interface AdministratorState {
  administrators: Administrator[];

  isLoadingAdministrators: boolean;
  administratorsError: string | null;

  isSavingAdministrator: boolean;
  administratorSaveError: string | null;

  fetchAdministrators: () => Promise<void>;
  createAdministrator: (data: AdministratorPayload) => Promise<Administrator | null>;
  updateAdministrator: (id: number, data: AdministratorPayload) => Promise<Administrator | null>;
  deleteAdministrator: (id: number) => Promise<void>;
}

export const useAdministratorStore = create<AdministratorState>((set) => ({
  administrators: [],

  isLoadingAdministrators: false,
  administratorsError: null,

  isSavingAdministrator: false,
  administratorSaveError: null,

  fetchAdministrators: async () => {
    set({ isLoadingAdministrators: true, administratorsError: null });
    try {
      const { data } = await administratorsService.list();
      set({ administrators: data, isLoadingAdministrators: false });
    } catch (err: any) {
      set({
        administratorsError: formatFieldErrors(err),
        isLoadingAdministrators: false,
      });
    }
  },

  createAdministrator: async (data: AdministratorPayload) => {
    set({ isSavingAdministrator: true, administratorSaveError: null });
    try {
      const { data: created } = await administratorsService.create(data);
      set((s) => ({
        administrators: [...s.administrators, created],
        isSavingAdministrator: false,
      }));
      return created;
    } catch (err: any) {
      set({ administratorSaveError: formatFieldErrors(err), isSavingAdministrator: false });
      return null;
    }
  },

  updateAdministrator: async (id: number, data: AdministratorPayload) => {
    set({ isSavingAdministrator: true, administratorSaveError: null });
    try {
      const { data: updated } = await administratorsService.update(id, data);
      set((s) => ({
        administrators: s.administrators.map((a) => (a.id === id ? updated : a)),
        isSavingAdministrator: false,
      }));
      return updated;
    } catch (err: any) {
      set({ administratorSaveError: formatFieldErrors(err), isSavingAdministrator: false });
      return null;
    }
  },

  deleteAdministrator: async (id: number) => {
    try {
      await administratorsService.delete(id);
      set((s) => ({
        administrators: s.administrators.filter((a) => a.id !== id),
      }));
    } catch {
      // surface via existing list error if needed
    }
  },
}));