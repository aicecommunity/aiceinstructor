"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { AUTH_APP_URL } from "../utils/MyConstants";
import AccessDenied from "./AccessDenied";

// Only the instructor role, a profile bound to an instructor byline, or a
// Django superuser may use the instructor app. `is_instructor_byline` comes
// from /api/profiles/me/ and is true once the user is linked via the
// superuser-only Instructors manager.
const INSTRUCTOR_ROLES = ["instructor"];

const authTarget = AUTH_APP_URL
  ? `${AUTH_APP_URL.replace(/\/$/, "")}/?redirect=instructor`
  : "/";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, isUserLoading, isProfileLoading, loadMe, loadProfile } = useAuthStore();

  // 1. Check the cookie session on load (same as aicelearn/aicecommunity).
  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // 2. Once we know the user, fetch their profile to read the role.
  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  // 3. No session → send the user to aiceauth to log in (cookie session sharing).
  useEffect(() => {
    if (!isUserLoading && !user) {
      window.location.href = authTarget;
    }
  }, [isUserLoading, user, router]);

  const isInstructor = useMemo(
    () =>
      user?.is_superuser ||
      profile?.is_instructor_byline ||
      (profile?.role != null && INSTRUCTOR_ROLES.includes(profile.role)),
    [user, profile]
  );

  const handleGoToAuth = () => {
    window.location.href = authTarget;
  };

  // Loading: session still being checked, or profile still being fetched for a
  // logged-in user. Show a neutral loading state.
  if (!isUserLoading && user && isProfileLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#195C49] border-t-transparent" />
      </div>
    );
  }

  // No session yet → redirect effect is in flight; render nothing.
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#195C49] border-t-transparent" />
      </div>
    );
  }

  // Session but not the instructor role (or a superuser) → access denied.
  if (!isInstructor) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <AccessDenied />
          </div>
        </div>
        <button
          type="button"
          onClick={handleGoToAuth}
          className="mx-auto mb-8 text-sm font-medium text-[#195C49] hover:underline"
        >
          Go to the main site
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
