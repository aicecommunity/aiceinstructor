"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { useEnrollmentStore } from "../../store/useEnrollmentStore";
import { enrollments as enrollmentsApi } from "../../services/enrollments";
import type { Enrollment, EnrollmentStats } from "../../types/enrollment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

interface Props {
  onSelect?: (enrollment: Enrollment) => void;
  selectedId?: number | null;
}

export default function EnrollmentsManager({ onSelect, selectedId }: Props) {
  const { enrollments, isLoadingEnrollments, enrollmentsError, fetchEnrollments } =
    useEnrollmentStore();
  // Shared context (prompt 08): picking here also sets the app-wide selection so
  // Units and Records inherit it.
  const sharedSelectedId = useEnrollmentStore((s) => s.selectedEnrollmentId);
  const sharedSelect = useEnrollmentStore((s) => s.selectEnrollment);
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [statsMap, setStatsMap] = useState<Record<number, EnrollmentStats>>({});
  const [statsLoading, setStatsLoading] = useState<Record<number, boolean>>({});
  const [statsError, setStatsError] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Preload stats for every row so the "Enrolled" column is populated without
  // expanding each one. fetchStats caches into statsMap, so expands are instant.
  useEffect(() => {
    if (enrollments.length === 0) return;
    enrollments.forEach((enrollment) => {
      if (!statsMap[enrollment.id] && !statsLoading[enrollment.id]) {
        fetchStats(enrollment.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments]);

  const fetchStats = useCallback(
    (enrollmentId: number) => {
      setStatsLoading((l) => ({ ...l, [enrollmentId]: true }));
      enrollmentsApi
        .stats(enrollmentId)
        .then((res) => {
          setStatsMap((m) => ({ ...m, [enrollmentId]: res.data }));
          setStatsError((e) => {
            const next = { ...e };
            delete next[enrollmentId];
            return next;
          });
        })
        .catch((err) => {
          setStatsError((e) => ({
            ...e,
            [enrollmentId]:
              err?.response?.data?.detail ?? err?.message ?? "Failed to load stats.",
          }));
        })
        .finally(() => {
          setStatsLoading((l) => {
            const next = { ...l };
            delete next[enrollmentId];
            return next;
          });
        });
    },
    []
  );

  const toggleDetails = (enrollmentId: number) => {
    if (expandedIds.has(enrollmentId)) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
      return;
    }
    setExpandedIds((prev) => new Set(prev).add(enrollmentId));
    if (!statsMap[enrollmentId] && !statsLoading[enrollmentId]) {
      fetchStats(enrollmentId);
    }
  };

  const courses = useMemo(() => {
    const map = new Map<number, string>();
    enrollments.forEach((e) => map.set(e.course.id, e.course.title));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [enrollments]);

  const filtered = useMemo(() => {
    if (courseFilter === "all") return enrollments;
    return enrollments.filter((e) => String(e.course.id) === courseFilter);
  }, [enrollments, courseFilter]);

  // Note: the backend /api/enrollments/ endpoint has NO server-side "by course"
  // filter, so we filter the full list here on the client (see report 04).

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enrollments</h1>
          <p className="text-sm text-muted-foreground">
            Pick the Enrollment to author content for (content is keyed off
            Enrollment, not Course, for v1).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by course:</span>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map(([id, title]) => (
                <SelectItem key={id} value={String(id)}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            The backend /api/enrollments/ endpoint returns all active enrollments with
            no server-side course/is_active/is_paid filters. The course filter above is
            applied on the client from the embedded course data. Picking a row sets the
            app-wide context carried to Units &amp; Content and Student Records. No data
            is faked.
          </span>
      </p>

      {isLoadingEnrollments ? (
        <LoadingState className="mt-6" rows={2} />
      ) : enrollmentsError ? (
        <ErrorState className="mt-6" message={enrollmentsError} onRetry={fetchEnrollments} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Course title</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((enrollment) => {
                const selected = (selectedId ?? sharedSelectedId) === enrollment.id;
                const expanded = expandedIds.has(enrollment.id);
                const stats = statsMap[enrollment.id];
                return (
                  <Fragment key={enrollment.id}>
                    <TableRow
                      className={onSelect ? "cursor-pointer" : undefined}
                      onClick={() => {
                        sharedSelect(enrollment.id);
                        onSelect?.(enrollment);
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {selected && <Badge>Picked</Badge>}
                          {enrollment.course.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {stats ? (
                          <span className="font-medium tabular-nums">{stats.total_enrolled}</span>
                        ) : statsError[enrollment.id] ? (
                          <span className="text-muted-foreground">—</span>
                        ) : statsLoading[enrollment.id] ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.is_active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.is_paid ? (
                          <Badge variant="outline">Paid</Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.is_paid ? (
                          formatPrice(enrollment.price, enrollment.currency)
                        ) : (
                          "Free"
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleDetails(enrollment.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          Details
                          <ChevronRight
                            className={`size-3.5 transition-transform ${
                              expanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="border-t-0 bg-muted/40 p-4">
                          {statsLoading[enrollment.id] ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              Loading stats…
                            </div>
                          ) : statsError[enrollment.id] ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-destructive">
                                {statsError[enrollment.id]}
                              </span>
                              <button
                                type="button"
                                onClick={() => fetchStats(enrollment.id)}
                                className="text-xs font-medium text-blue-600 underline"
                              >
                                Retry
                              </button>
                            </div>
                          ) : stats ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {[
                                { label: "Enrolled", value: stats.total_enrolled, tone: "text-muted-foreground" },
                                { label: "Still learning", value: stats.learning, tone: "text-blue-600" },
                                { label: "Completed", value: stats.completed, tone: "text-green-600" },
                                { label: "Failed", value: stats.failed, tone: "text-red-600" },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="rounded-lg border border-border bg-background p-3"
                                >
                                  <div className="text-xs text-muted-foreground">
                                    {item.label}
                                  </div>
                                  <div className={`mt-1 text-2xl font-semibold ${item.tone}`}>
                                    {item.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
