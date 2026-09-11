"use client";

import { Award } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import AccessDenied from "../AccessDenied";
import TemplatesSection from "./TemplatesSection";
import CoursesSection from "./CoursesSection";

export default function CertificateManager() {
  const { user } = useAuthStore();

  // Certificate signatories are system-wide (they sign everyone's certificates):
  // superusers only.
  if (user && !user.is_superuser) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Award className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Manage certificate templates and assign instructors and administrators
            to sign course certificates (superuser only).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <TemplatesSection />
        <CoursesSection />
      </div>
    </div>
  );
}