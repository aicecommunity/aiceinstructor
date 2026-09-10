"use client";

import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCertificateStore } from "../../store/useCertificateStore";
import type { CertificateCourse } from "../../types/certificates";
import CourseSignatoriesDialog from "./CourseSignatoriesDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

export default function CoursesSection() {
  const { courses, isLoadingCourses, coursesError, fetchCourses } = useCertificateStore();

  const [dialogTarget, setDialogTarget] = useState<CertificateCourse | null>(null);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Courses</h2>
        <p className="text-xs text-muted-foreground">
          Assign the signatories that appear on each course&apos;s certificate.
        </p>
      </div>

      {isLoadingCourses ? (
        <LoadingState className="mt-4" rows={2} />
      ) : coursesError ? (
        <ErrorState className="mt-4" message={coursesError} onRetry={fetchCourses} />
      ) : (
        <div className="mt-4 grid gap-3">
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.certificate_name || course.slug}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogTarget(course)}
                  >
                    <PenLine className="size-4" /> Assign
                  </Button>
                </div>
                {course.signatories.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...course.signatories]
                      .sort((a, b) => a.order - b.order)
                      .map((sig) => (
                        <Badge key={sig.id} variant="secondary">
                          <span className="tabular-nums text-foreground/60">{sig.order + 1}.</span>{" "}
                          {sig.name}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No signatories assigned — click Assign.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <CourseSignatoriesDialog
        open={dialogTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDialogTarget(null);
        }}
        course={dialogTarget}
      />
    </section>
  );
}