"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
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
import CertificatePreviewLinks from "./CertificatePreviewLinks";
import CoursePreviewButton from "./CoursePreviewButton";
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
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Group link</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                    <TableCell>
                      {course.image_url || course.image ? (
                        <a
                          href={course.image_url || (course.image as string)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open image in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={course.image_url || (course.image as string)}
                            alt={course.title}
                            className="h-10 w-16 rounded border object-cover transition-opacity hover:opacity-80"
                          />
                        </a>
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed text-muted-foreground">
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>
                      {course.duration_weeks} wk
                    </TableCell>
                    <TableCell>
                      {course.status === "active" ? (
                        <Badge>Active</Badge>
                      ) : course.status === "coming_soon" ? (
                        <Badge className="bg-amber-400 text-black hover:bg-amber-500">
                          Coming Soon
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.group_link ? (
                        <a
                          href={course.group_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open group link in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                            Yes
                          </Badge>
                        </a>
                      ) : (
                        <Badge variant="secondary">No</Badge>
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
                        colSpan={8}
                        className="whitespace-normal break-words bg-muted/20 align-top"
                      >
                        <div className="grid gap-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            {course.description || "No description."}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 rounded-md border p-4">
                            <CoursePreviewButton course={course} />
                            <span className="text-sm text-muted-foreground">
                              Opens the course in the learn app exactly as an
                              enrolled learner sees it — every unit unlocked,
                              quizzes and practicals scored but{" "}
                              <strong>not saved</strong>.
                            </span>
                          </div>
                          <CertificatePreviewLinks course={course} />
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
