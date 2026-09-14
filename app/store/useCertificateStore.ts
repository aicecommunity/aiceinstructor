// app/store/useCertificateStore.ts
// Certificate signatories, template images + per-course signatory assignments.
// All superuser-only.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { certificates as certificatesService } from "../services/certificates";
import type {
  Signatory,
  CertificateCourse,
  SignatoryAssignment,
  CertificateTemplate,
  CertificateTemplatePayload,
  CertificateTemplateType,
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

  courses: CertificateCourse[];
  isLoadingCourses: boolean;
  coursesError: string | null;
  isAssigning: boolean;
  assigningError: string | null;

  templates: CertificateTemplate[];
  isLoadingTemplates: boolean;
  templatesError: string | null;
  isSavingTemplate: boolean;
  templateSaveError: string | null;
  isDeletingTemplate: boolean;

  fetchAll: () => Promise<void>;
  fetchSignatories: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  fetchTemplates: () => Promise<void>;

  createTemplate: (data: CertificateTemplatePayload) => Promise<CertificateTemplate | null>;
  updateTemplate: (id: number, data: CertificateTemplatePayload) => Promise<CertificateTemplate | null>;
  deleteTemplate: (id: number) => Promise<boolean>;
  clearTemplateSaveError: () => void;

  assignSignatories: (courseId: number, definitionIndex: number, assignments: SignatoryAssignment[], signatureType: CertificateTemplateType) => Promise<CertificateCourse | null>;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  signatories: [],
  isLoadingSignatories: false,
  signatoriesError: null,

  courses: [],
  isLoadingCourses: false,
  coursesError: null,
  isAssigning: false,
  assigningError: null,

  templates: [],
  isLoadingTemplates: false,
  templatesError: null,
  isSavingTemplate: false,
  templateSaveError: null,
  isDeletingTemplate: false,

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

  fetchTemplates: async () => {
    set({ isLoadingTemplates: true, templatesError: null });
    try {
      const { data } = await certificatesService.listTemplates();
      // Oldest first (id auto-increments with creation), stable across all
      // load paths — matches the sort applied on create/update below.
      set({ templates: [...data].sort((a, b) => a.id - b.id), isLoadingTemplates: false });
    } catch (err: any) {
      set({ templatesError: formatFieldErrors(err), isLoadingTemplates: false });
    }
  },

  fetchAll: async () => {
    // Kick all loads; each manages its own loading/error flags.
    useCertificateStore.getState().fetchSignatories();
    useCertificateStore.getState().fetchCourses();
    useCertificateStore.getState().fetchTemplates();
  },

  createTemplate: async (data: CertificateTemplatePayload) => {
    set({ isSavingTemplate: true, templateSaveError: null });
    try {
      const { data: created } = await certificatesService.createTemplate(data);
      set((s) => ({
        templates: [...s.templates, created].sort((a, b) => a.id - b.id),
        isSavingTemplate: false,
      }));
      return created;
    } catch (err: any) {
      set({ templateSaveError: formatFieldErrors(err), isSavingTemplate: false });
      return null;
    }
  },

  updateTemplate: async (id: number, data: CertificateTemplatePayload) => {
    set({ isSavingTemplate: true, templateSaveError: null });
    try {
      const { data: updated } = await certificatesService.updateTemplate(id, data);
      set((s) => ({
        templates: s.templates
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.id - b.id),
        isSavingTemplate: false,
      }));
      return updated;
    } catch (err: any) {
      set({ templateSaveError: formatFieldErrors(err), isSavingTemplate: false });
      return null;
    }
  },

  deleteTemplate: async (id: number) => {
    set({ isDeletingTemplate: true });
    try {
      await certificatesService.deleteTemplate(id);
      set((s) => ({
        templates: s.templates.filter((t) => t.id !== id),
        isDeletingTemplate: false,
      }));
      return true;
    } catch {
      set({ isDeletingTemplate: false });
      return false;
    }
  },

  clearTemplateSaveError: () => set({ templateSaveError: null }),

  assignSignatories: async (courseId: number, definitionIndex: number, assignments: SignatoryAssignment[], signatureType: CertificateTemplateType) => {
    set({ isAssigning: true, assigningError: null });
    try {
      const { data } = await certificatesService.assignSignatories(courseId, definitionIndex, {
        signature_type: signatureType,
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