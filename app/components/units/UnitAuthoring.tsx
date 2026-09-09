"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEnrollmentStore } from "../../store/useEnrollmentStore";
import { useUnitStore } from "../../store/useUnitStore";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NotConnectedBanner from "../NotConnectedBanner";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import EmptyState from "../state/EmptyState";
import type { CalendarUnit } from "../../types/curriculum";
import UnitFormDialog from "./UnitFormDialog";
import ContentList from "./ContentList";
import { useAssessmentSummaries } from "../assessment/useAssessmentSummaries";
import AssessmentStatusBadge from "../assessment/AssessmentStatusBadge";

export default function UnitAuthoring() {
  const { enrollments, isLoadingEnrollments, enrollmentsError, fetchEnrollments } =
    useEnrollmentStore();
  // Shared context (prompt 08): the enrollment picked on Enrollments or Records
  // carries through here so the user doesn't re-pick it.
  const selectedEnrollmentId = useEnrollmentStore((s) => s.selectedEnrollmentId);
  const sharedSelect = useEnrollmentStore((s) => s.selectEnrollment);
  const {
    enrollmentId,
    calendar,
    units,
    isLoadingCalendar,
    calendarError,
    fetchCalendar,
    deleteUnit,
  } = useUnitStore();
  const clearUnit = useAssessmentStore((s) => s.clearUnit);

  const [unitDialog, setUnitDialog] = useState<{
    open: boolean;
    unit?: CalendarUnit | null;
  }>({ open: false, unit: null });
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // If a shared enrollment was selected elsewhere (Enrollments, Records), load
  // its calendar here so no re-picking is needed.
  useEffect(() => {
    if (enrollmentId == null && selectedEnrollmentId != null) {
      void fetchCalendar(selectedEnrollmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, selectedEnrollmentId]);

  // Warm assessment summaries so each unit row can show its status pill.
  useAssessmentSummaries(units);

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  const handleSelectEnrollment = async (value: string) => {
    const id = Number(value);
    sharedSelect(id);
    await fetchCalendar(id);
    setExpandedUnit(null);
  };

  const openCreate = () => setUnitDialog({ open: true, unit: null });
  const openEdit = (unit: CalendarUnit) => setUnitDialog({ open: true, unit });
  const close = () => setUnitDialog((d) => ({ ...d, open: false }));

  const handleDelete = async (unit: CalendarUnit) => {
    if (!enrollmentId) return;
    if (!confirm(`Delete unit "${unit.title}"?`)) return;
    await deleteUnit(enrollmentId, unit.id);
    clearUnit(unit.id);
    toast.success("Unit deleted");
  };

  const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unit &amp; content authoring</h1>
          <p className="text-sm text-muted-foreground">
            Manage units and their content for a chosen Enrollment&apos;s ProgramCalendar.
            Assessments live on their own screen.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="text-sm text-muted-foreground">Enrollment:</span>
          {isLoadingEnrollments ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <Select
              value={enrollmentId != null ? String(enrollmentId) : selectedEnrollmentId != null ? String(selectedEnrollmentId) : ""}
              onValueChange={(v) => handleSelectEnrollment(v)}
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
        <NotConnectedBanner feature="Unit and content authoring" />
      </div>

      {enrollmentsError && (
        <ErrorState className="mt-3" message={enrollmentsError} onRetry={fetchEnrollments} />
      )}

      {enrollmentId == null && selectedEnrollmentId == null ? (
        <EmptyState
          className="mt-8"
          message="Select an enrollment above to load its ProgramCalendar and author units."
        />
      ) : isLoadingCalendar ? (
        <LoadingState className="mt-6" rows={2} height={48} />
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {selectedEnrollment?.course.title ?? `Enrollment #${enrollmentId ?? selectedEnrollmentId}`}
              </p>
              <p className="text-xs text-muted-foreground">ProgramCalendar · {sortedUnits.length} units</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Add unit
            </Button>
          </div>

          {calendarError && (
            <ErrorState className="mt-3" message={calendarError} onRetry={() => enrollmentId && fetchCalendar(enrollmentId)} />
          )}

          {sortedUnits.length === 0 && !calendarError ? (
            <EmptyState className="mt-6" message="No units in this calendar yet. Add the first unit." />
          ) : (
            <ul className="mt-4 divide-y rounded-md border">
              {sortedUnits.map((unit) => {
                const expanded = expandedUnit === unit.id;
                return (
                  <Fragment key={unit.id}>
                    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedUnit(expanded ? null : unit.id)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left sm:items-center"
                      >
                        {expanded ? (
                          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="line-clamp-2 break-words font-medium sm:truncate sm:whitespace-nowrap">
                          {unit.title}
                        </span>
                      </button>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:ml-auto sm:shrink-0 sm:gap-x-3">
                        <Badge variant="outline" className="shrink-0">Unit {unit.order}</Badge>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {unit.duration_days} days · {unit.contents.length} content
                        </span>
                        <AssessmentStatusBadge unitId={unit.id} />
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button variant="ghost" size="sm" className="px-1.5" onClick={() => openEdit(unit)} aria-label={`Edit ${unit.title}`}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="px-1.5" onClick={() => handleDelete(unit)} aria-label={`Delete ${unit.title}`}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                    {expanded && (
                      <li className="bg-muted/20 px-4 py-4">
                        {unit.description && (
                          <p className="mb-3 text-sm text-muted-foreground">{unit.description}</p>
                        )}
                        <ContentList enrollmentId={(enrollmentId ?? selectedEnrollmentId)!} unit={unit} />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Assessment for this unit is authored on the dedicated screen.
                          </p>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/assessments">
                              Manage assessment <ExternalLink className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <UnitFormDialog
        key={unitDialog.unit?.id ?? "new"}
        open={unitDialog.open}
        onOpenChange={close}
        enrollmentId={enrollmentId ?? 0}
        unit={unitDialog.unit}
      />
    </div>
  );
}