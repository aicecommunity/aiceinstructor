"use client";

import { useEffect } from "react";
import { Users } from "lucide-react";
import { useEnrollmentStore } from "../../store/useEnrollmentStore";
import { useCohortStore } from "../../store/useCohortStore";
import { useStudentsStore } from "../../store/useStudentsStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import EmptyState from "../state/EmptyState";
import LearnerRecordsTable from "./LearnerRecordsTable";

export default function RecordsScreen() {
  // Shared context (prompt 08): enrollment + cohort chosen here (or carried in
  // from Enrollments/Units) are kept app-wide so picks persist across screens.
  const selectedCohortId = useEnrollmentStore((s) => s.selectedCohortId);
  const selectCohort = useEnrollmentStore((s) => s.selectCohort);
  const selectedEnrollmentId = useEnrollmentStore((s) => s.selectedEnrollmentId);
  const selectEnrollment = useEnrollmentStore((s) => s.selectEnrollment);
  const {
    enrollments,
    isLoadingEnrollments,
    enrollmentsError,
    fetchEnrollments,
  } = useEnrollmentStore();
  const {
    selectedCohortCohorts,
    isLoadingCohorts,
    cohortsError,
    fetchCohortsByEnrollment,
  } = useCohortStore();
  const {
    progress,
    progressError,
    isLoadingProgress,
    records,
    recordsError,
    isLoadingRecords,
    clear,
    fetchProgress,
    fetchRecords,
  } = useStudentsStore();

  const cohort = selectedCohortId != null
    ? selectedCohortCohorts.find((c) => c.id === selectedCohortId)
    : undefined;

  useEffect(() => {
    if (enrollments.length === 0) fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When an enrollment is chosen (in-page or carried from another screen), load
  // that enrollment's cohorts.
  useEffect(() => {
    if (selectedEnrollmentId == null) return;
    clear();
    void fetchCohortsByEnrollment(selectedEnrollmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnrollmentId]);

  // When a cohort is chosen (in-page or carried back), fetch its progress + roster.
  useEffect(() => {
    if (selectedCohortId == null || !cohort) return;
    const courseSlug =
      cohort.enrollment_detail?.course?.slug ??
      cohort.enrollment_code.toLowerCase().replace(/\s+/g, "-");
    const courseTitle = cohort.enrollment_detail?.course?.title ?? cohort.enrollment_name;
    void fetchProgress(selectedCohortId);
    void fetchRecords({
      cohortId: selectedCohortId,
      cohortName: cohort.name,
      courseSlug,
      courseTitle,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohortId, cohort]);

  const handleSelectEnrollment = (value: string) => {
    selectEnrollment(Number(value));
    selectCohort(null);
  };

  const handleSelectCohort = (value: string) => {
    selectCohort(Number(value));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student records</h1>
        <p className="text-sm text-muted-foreground">
          Learner completion, quiz, and practical status within a cohort.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Enrollment:</span>
          {isLoadingEnrollments ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <Select
              value={selectedEnrollmentId != null ? String(selectedEnrollmentId) : ""}
              onValueChange={handleSelectEnrollment}
            >
              <SelectTrigger className="w-72">
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cohort:</span>
          {isLoadingCohorts ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <Select
              value={selectedCohortId != null ? String(selectedCohortId) : ""}
              onValueChange={handleSelectCohort}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a cohort" />
              </SelectTrigger>
              <SelectContent>
                {selectedCohortCohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={String(cohort.id)}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {enrollmentsError && (
        <ErrorState className="mt-4" message={enrollmentsError} onRetry={fetchEnrollments} />
      )}

      {cohortsError && (
        <ErrorState className="mt-4" message={cohortsError} />
      )}

      {selectedEnrollmentId == null ? (
        <EmptyState
          className="mt-10"
          message="Select an enrollment, then a cohort, to view learner records."
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Roster, completion, quiz attempts, practical submissions, and review are
            pulled live from the backend for this cohort.
          </p>

          {/* REAL aggregate progress header */}
          {isLoadingProgress ? (
            <LoadingState className="mt-4" rows={1} height={48} />
          ) : progressError ? (
            <ErrorState className="mt-4" message={progressError} />
          ) : progress ? (
            <div className="mt-5 rounded-md border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-muted-foreground" />
                    {progress.cohort_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progress.course_progress.course_title} · week {progress.course_progress.current_week}
                    {" · "}
                    {new Date(progress.course_progress.start_date).toLocaleDateString()}
                    {progress.course_progress.end_date
                      ? ` → ${new Date(progress.course_progress.end_date).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cohort progress</span>
                  <Badge>{progress.course_progress.progress}%</Badge>
                </div>
              </div>
            </div>
          ) : null}

          {/* REAL learner roster */}
          {isLoadingRecords ? (
            <LoadingState className="mt-5" rows={2} />
          ) : recordsError ? (
            <ErrorState className="mt-5" message={recordsError} />
          ) : (
            <div className="mt-5">
              <LearnerRecordsTable cohortId={selectedCohortId ?? 0} records={records} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
