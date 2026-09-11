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

function layoutCountLabel(signatureType: string): string {
  return signatureType === "3" ? "3 signatures" : "2 signatures";
}

export default function CoursesSection() {
  const {
    courses,
    isLoadingCourses,
    coursesError,
    fetchCourses,
    fetchSignatories,
    fetchTemplates,
  } = useCertificateStore();

  const [dialogTarget, setDialogTarget] = useState<CertificateCourse | null>(null);

  useEffect(() => {
    fetchCourses();
    // Signatories are needed by the assignment picker (instructors/administrators).
    fetchSignatories();
    // Certificate layouts (two/three signatures) feed the layout picker.
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Courses</h2>
        <p className="text-xs text-muted-foreground">
          Assign instructors and administrators to sign each course&apos;s certificate.
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

                <div className="mt-3 flex items-start gap-3">
                  {course.layout?.image_url ? (
                    <a
                      href={course.layout.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open certificate layout in a new tab"
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.layout.image_url}
                        alt={course.layout.name || "Certificate layout"}
                        className="h-16 w-28 rounded-md border object-cover transition hover:opacity-80"
                      />
                    </a>
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-center text-[10px] leading-tight text-muted-foreground">
                      No layout
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {course.layout ? (
                      <p className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {layoutCountLabel(course.layout.signature_type)}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {course.layout.name}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No signature layout assigned yet.
                      </p>
                    )}

                    {course.signatories.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {[...course.signatories]
                          .sort((a, b) => a.order - b.order)
                          .map((sig) => (
                            <Badge key={sig.id} variant="secondary">
                              <span className="tabular-nums text-foreground/60">
                                {sig.order + 1}.
                              </span>{" "}
                              {sig.name}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        No signatories assigned — click Assign.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <CourseSignatoriesDialog
        key={dialogTarget?.id ?? "no-course"}
        open={dialogTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDialogTarget(null);
        }}
        course={dialogTarget}
      />
    </section>
  );
}