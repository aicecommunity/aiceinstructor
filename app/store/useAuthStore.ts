/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { auth } from "../services/auth";
import { profile } from "../services/profile";

export interface SessionUser {
  id?: string;
  full_name?: string;
  email?: string;
  username?: string;
  profile_pic?: string;
}

export interface InstructorProfile {
  user_id: number;
  aice_id: string;
  username: string;
  full_name: string;
  email: string;
  role: string | null;
  role_display: string | null;
  role_rank: number;
  profile_picture: string | null;
}

interface AuthState {
  user: SessionUser | null;
  profile: InstructorProfile | null;

  isUserLoading: boolean;
  isProfileLoading: boolean;
  userError: string | null;
  profileError: string | null;

  loadMe: () => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,

  isUserLoading: true,
  isProfileLoading: false,
  userError: null,
  profileError: null,

  loadMe: async () => {
    set({ isUserLoading: true, userError: null });
    try {
      const res = await auth.me();
      set({ user: res.data, isUserLoading: false });
    } catch (err: any) {
      set({ user: null, userError: err?.message || "Not authenticated", isUserLoading: false });
    }
  },

  loadProfile: async () => {
    if (!get().user) return;
    set({ isProfileLoading: true, profileError: null });
    try {
      const res = await profile.getMe();
      set({ profile: res.data, isProfileLoading: false });
    } catch (err: any) {
      set({
        profile: null,
        profileError: err?.response?.data?.detail || err?.message || "Failed to load profile",
        isProfileLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await auth.logout();
    } catch {
      // ignore — clear local state either way
    }
    set({ user: null, profile: null });
    window.location.href = "/";
  },
}));
