// app/store/useCertificateStore.ts
// Certificate signatories + per-course signatory assignments (superuser only).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { certificates as certificatesService } from "../services/certificates";
import type {
  Signatory,
  SignatoryPayload,
  CertificateCourse,
  SignatoryAssignment,
} from "../types/certificates";

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

interface CertificateState {
  signatories: Signatory[];
  isLoadingSignatories: boolean;
  signatoriesError: string | null;
  isSavingSignatory: boolean;
  signatorySaveError: string | null;

  courses: CertificateCourse[];
  isLoadingCourses: boolean;
  coursesError: string | null;
  isAssigning: boolean;
  assigningError: string | null;

  fetchAll: () => Promise<void>;
  fetchSignatories: () => Promise<void>;
  fetchCourses: () => Promise<void>;

  createSignatory: (data: SignatoryPayload) => Promise<Signatory | null>;
  updateSignatory: (id: number, data: SignatoryPayload) => Promise<Signatory | null>;
  deleteSignatory: (id: number) => Promise<void>;

  assignSignatories: (courseId: number, assignments: SignatoryAssignment[]) => Promise<CertificateCourse | null>;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  signatories: [],
  isLoadingSignatories: false,
  signatoriesError: null,
  isSavingSignatory: false,
  signatorySaveError: null,

  courses: [],
  isLoadingCourses: false,
  coursesError: null,
  isAssigning: false,
  assigningError: null,

  fetchSignatories: async () => {
    set({ isLoadingSignatories: true, signatoriesError: null });
    try {
      const { data } = await certificatesService.listSignatories();
      set({ signatories: data, isLoadingSignatories: false });
    } catch (err: any) {
      set({
        signatoriesError: formatFieldErrors(err),
        isLoadingSignatories: false,
      });
    }
  },

  fetchCourses: async () => {
    set({ isLoadingCourses: true, coursesError: null });
    try {
      const { data } = await certificatesService.listCourses();
      set({ courses: data, isLoadingCourses: false });
    } catch (err: any) {
      set({ coursesError: formatFieldErrors(err), isLoadingCourses: false });
    }
  },

  fetchAll: async () => {
    // Kick both loads; each manages its own loading/error flags.
    useCertificateStore.getState().fetchSignatories();
    useCertificateStore.getState().fetchCourses();
  },

  createSignatory: async (data: SignatoryPayload) => {
    set({ isSavingSignatory: true, signatorySaveError: null });
    try {
      const { data: created } = await certificatesService.createSignatory(data);
      set((s) => ({
        signatories: [...s.signatories, created].sort((a, b) => a.order - b.order),
        isSavingSignatory: false,
      }));
      return created;
    } catch (err: any) {
      set({ signatorySaveError: formatFieldErrors(err), isSavingSignatory: false });
      return null;
    }
  },

  updateSignatory: async (id: number, data: SignatoryPayload) => {
    set({ isSavingSignatory: true, signatorySaveError: null });
    try {
      const { data: updated } = await certificatesService.updateSignatory(id, data);
      set((s) => ({
        signatories: s.signatories.map((sig) => (sig.id === id ? updated : sig)).sort((a, b) => a.order - b.order),
        isSavingSignatory: false,
      }));
      return updated;
    } catch (err: any) {
      set({ signatorySaveError: formatFieldErrors(err), isSavingSignatory: false });
      return null;
    }
  },

  deleteSignatory: async (id: number) => {
    try {
      await certificatesService.deleteSignatory(id);
      set((s) => ({
        signatories: s.signatories.filter((sig) => sig.id !== id),
      }));
    } catch {
      // surface via existing list error if needed
    }
  },

  assignSignatories: async (courseId: number, assignments: SignatoryAssignment[]) => {
    set({ isAssigning: true, assigningError: null });
    try {
      const { data } = await certificatesService.assignSignatories(courseId, {
        signatories: assignments,
      });
      set((s) => ({
        courses: s.courses.map((c) => (c.id === courseId ? data : c)),
        isAssigning: false,
      }));
      return data;
    } catch (err: any) {
      set({ assigningError: formatFieldErrors(err), isAssigning: false });
      return null;
    }
  },
}));