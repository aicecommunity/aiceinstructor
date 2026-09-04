"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useEnrollmentStore } from "../../store/useEnrollmentStore";
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
import type { Enrollment } from "../../types/enrollment";
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

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

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
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Order</TableHead>
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
                return (
                  <TableRow
                    key={enrollment.id}
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
                    <TableCell>#{enrollment.id}</TableCell>
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
                      {enrollment.currency} {enrollment.price}
                    </TableCell>
                    <TableCell>{enrollment.order ?? "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
