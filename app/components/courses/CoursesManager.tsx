"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCourseStore } from "../../store/useCourseStore";
import type { Course } from "../../types/course";
import CourseFormDialog from "./CourseFormDialog";
import InstructorByline from "./InstructorByline";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function CoursesManager() {
  const {
    courses,
    isLoadingCourses,
    coursesError,
    isDeletingCourse,
    fetchCourses,
    deleteCourse,
  } = useCourseStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openEdit = (course: Course) => {
    setEditing(course);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = async (course: Course) => {
    await deleteCourse(course.id);
    setDeleteTarget(null);
    toast.success("Course deleted");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage the AiCE curriculum (live /api/courses/).
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="size-4" /> New course
          </Link>
        </Button>
      </div>

      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Course visibility is scoped by creator: instructors only see courses
        they created, while superusers see every course (including backend-seeded
        ones, labeled as created by superuser). Reads/writes via
        `IsInstructorOrSuperuserOrReadOnly`.
      </p>

      {isLoadingCourses ? (
        <LoadingState className="mt-6" rows={3} />
      ) : coursesError ? (
        <ErrorState className="mt-6" message={coursesError} onRetry={fetchCourses} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No courses yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course, index) => (
                <Fragment key={course.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() =>
                      setExpanded((e) => (e === course.id ? null : course.id))
                    }
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      {course.duration_weeks} wk
                    </TableCell>
                    <TableCell>
                      {course.is_active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.created_by ? (
                        course.created_by.full_name
                      ) : (
                        <Badge variant="secondary">Superuser</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="inline-flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDeletingCourse}
                          onClick={() => openEdit(course)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingCourse}
                          onClick={() => setDeleteTarget(course)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === course.id && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="whitespace-normal break-words bg-muted/20 align-top"
                      >
                        <div className="grid gap-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            {course.description || "No description."}
                          </p>
                          <InstructorByline course={course} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <CourseFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editing}
        onSaved={() => {
          setExpanded(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Delete course"
        description={
          deleteTarget
            ? `Course "${deleteTarget.title}" will be permanently deleted. This cannot be undone.`
            : ""
        }
        loading={isDeletingCourse}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
