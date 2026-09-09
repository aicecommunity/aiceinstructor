"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useEnrollmentStore } from "../../store/useEnrollmentStore";
import { useUnitStore } from "../../store/useUnitStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import NotConnectedBanner from "../NotConnectedBanner";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import EmptyState from "../state/EmptyState";
import { useAssessmentSummaries } from "./useAssessmentSummaries";
import AssessmentStatusBadge from "./AssessmentStatusBadge";
import AssessmentPanel from "./AssessmentPanel";

export default function AssessmentAuthoring() {
  const { enrollments, isLoadingEnrollments, enrollmentsError, fetchEnrollments } =
    useEnrollmentStore();
  const selectedEnrollmentId = useEnrollmentStore((s) => s.selectedEnrollmentId);
  const sharedSelect = useEnrollmentStore((s) => s.selectEnrollment);
  const {
    enrollmentId,
    calendar,
    units,
    isLoadingCalendar,
    calendarError,
    fetchCalendar,
  } = useUnitStore();

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  useEffect(() => {
    if (enrollments.length === 0) fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shared context (prompt 08): an enrollment picked on the Units/Enrollments
  // screens carries through here so no re-picking is needed.
  useEffect(() => {
    if (enrollmentId == null && selectedEnrollmentId != null) {
      void fetchCalendar(selectedEnrollmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, selectedEnrollmentId]);

  // Warm the store with per-unit assessment summaries for the status pills.
  useAssessmentSummaries(units);

  const validUnitIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);
  useEffect(() => {
    if (selectedUnitId != null && !validUnitIds.has(selectedUnitId)) {
      setSelectedUnitId(null);
    }
  }, [validUnitIds, selectedUnitId]);

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const selectedUnit = sortedUnits.find((u) => u.id === selectedUnitId) ?? null;
  const selectedEnrollment = enrollments.find((e) => e.id === (enrollmentId ?? selectedEnrollmentId));

  const handleSelectEnrollment = async (value: string) => {
    const id = Number(value);
    sharedSelect(id);
    setSelectedUnitId(null);
    await fetchCalendar(id);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment authoring</h1>
          <p className="text-sm text-muted-foreground">
            Configure assessments and author quiz / practical questions per unit.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="text-sm text-muted-foreground">Enrollment:</span>
          {isLoadingEnrollments ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <Select
              value={enrollmentId != null ? String(enrollmentId) : selectedEnrollmentId != null ? String(selectedEnrollmentId) : ""}
              onValueChange={handleSelectEnrollment}
            >
              <SelectTrigger className="w-full min-w-0 sm:w-72 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:min-w-0">
                <SelectValue placeholder="Select an enrollment" />
              </SelectTrigger>
              <SelectContent>
                {enrollments.map((enrollment) => (
                  <SelectItem key={enrollment.id} value={String(enrollment.id)}>
                    #{enrollment.id} · {enrollment.course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="mt-4">
        <NotConnectedBanner feature="Assessment authoring (settings, quiz, practical)" />
      </div>

      {enrollmentsError && (
        <ErrorState className="mt-3" message={enrollmentsError} onRetry={fetchEnrollments} />
      )}

      {enrollmentId == null && selectedEnrollmentId == null ? (
        <EmptyState
          className="mt-8"
          message="Select an enrollment above to load its units and author assessments."
        />
      ) : isLoadingCalendar ? (
        <LoadingState className="mt-6" rows={2} height={48} />
      ) : (
        <div className="mt-6">
          <div className="rounded-md border bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium">
              {selectedEnrollment?.course.title ??
                calendar?.enrollment_title ??
                `Enrollment #${enrollmentId ?? selectedEnrollmentId}`}
            </p>
            <p className="text-xs text-muted-foreground">
              ProgramCalendar · {sortedUnits.length} units · pick a unit to author its assessment
            </p>
          </div>

          {calendarError && (
            <ErrorState
              className="mt-3"
              message={calendarError}
              onRetry={() => (enrollmentId ?? selectedEnrollmentId) && fetchCalendar(enrollmentId ?? selectedEnrollmentId!)}
            />
          )}

          {sortedUnits.length === 0 && !calendarError ? (
            <EmptyState className="mt-6" message="No units in this calendar yet. Add units on the Unit & Content page." />
          ) : (
            <div className="mt-4 grid items-start gap-4 lg:grid-cols-[300px_1fr]">
              {/* Units picker */}
              <nav className="min-w-0 rounded-md border bg-background">
                <p className="border-b px-4 py-2 text-sm font-medium">Units</p>
                {sortedUnits.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No units yet.</p>
                ) : (
                  <ul className="divide-y">
                    {sortedUnits.map((unit) => {
                      const active = unit.id === selectedUnitId;
                      return (
                        <li key={unit.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUnitId(active ? null : unit.id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                              active
                                ? "bg-[#195C49] text-white"
                                : "hover:bg-muted/40 text-gray-800"
                            }`}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold bg-muted/80 text-gray-700">
                              {unit.order}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{unit.title}</span>
                              <span className={`mt-0.5 block text-xs ${active ? "text-white/70" : "text-muted-foreground"}`}>
                                {unit.duration_days} days · {unit.contents.length} content
                              </span>
                            </span>
                            <ChevronRight className={`size-4 shrink-0 ${active ? "text-white/70" : "text-muted-foreground"}`} />
                          </button>
                          {active && (
                            <div className="border-t lg:hidden">
                              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 px-4 py-3">
                                <p className="min-w-0 flex-1 break-words text-sm font-medium">
                                  Unit {unit.order} · {unit.title}
                                </p>
                                <AssessmentStatusBadge unitId={unit.id} />
                              </div>
                              <AssessmentPanel
                                enrollmentId={enrollmentId ?? selectedEnrollmentId!}
                                courseSlug={calendar?.enrollment_slug ?? ""}
                                unit={unit}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </nav>

              {/* Editor (desktop split view only; mobile expands under the unit) */}
              <div className="hidden lg:block">
                {!selectedUnit ? (
                  <EmptyState
                    className="lg:min-h-[300px]"
                    message="Select a unit on the left to author its assessment."
                  />
                ) : (
                  <div className="rounded-md border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SlidersHorizontal className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Unit {selectedUnit.order} · {selectedUnit.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assessment settings, quiz questions, and practical questions
                          </p>
                        </div>
                      </div>
                      <AssessmentStatusBadge unitId={selectedUnit.id} />
                    </div>
                    <AssessmentPanel
                      key={selectedUnit.id}
                      enrollmentId={enrollmentId ?? selectedEnrollmentId!}
                      courseSlug={calendar?.enrollment_slug ?? ""}
                      unit={selectedUnit}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}