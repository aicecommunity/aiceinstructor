"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
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
import EmptyState from "../state/EmptyState";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

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

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete course "${course.title}"?`)) return;
    await deleteCourse(course.id);
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
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New course
        </Button>
      </div>

      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Note: the backend currently allows any authenticated user to create/edit
        courses (IsAuthenticatedOrReadOnly). This is a known permission gap, not a
        frontend issue. Instructor-specific write restrictions are planned backend
        hardening.
      </p>

      {isLoadingCourses ? (
        <LoadingState className="mt-6" rows={3} />
      ) : coursesError ? (
        <ErrorState className="mt-6" message={coursesError} onRetry={fetchCourses} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Active</TableHead>
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
              courses.map((course) => (
                <Fragment key={course.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() =>
                      setExpanded((e) => (e === course.id ? null : course.id))
                    }
                  >
                    <TableCell>{course.order}</TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {LEVEL_LABEL[course.level] || course.level}
                      </Badge>
                    </TableCell>
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
                          onClick={() => handleDelete(course)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === course.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/20">
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
    </div>
  );
}
