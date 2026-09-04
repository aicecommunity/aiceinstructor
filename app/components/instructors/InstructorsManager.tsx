"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInstructorStore } from "../../store/useInstructorStore";
import type { Instructor } from "../../types/course";
import InstructorFormDialog from "./InstructorFormDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

export default function InstructorsManager() {
  const {
    instructors,
    isLoadingInstructors,
    instructorsError,
    fetchInstructors,
    deleteInstructor,
  } = useInstructorStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (ins: Instructor) => {
    setEditing(ins);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = async (ins: Instructor) => {
    if (!confirm(`Delete instructor "${ins.name}"?`)) return;
    await deleteInstructor(ins.id);
    toast.success("Instructor deleted");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instructors</h1>
          <p className="text-sm text-muted-foreground">
            Course bylines (live /api/courses/instructors/).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add instructor
        </Button>
      </div>

      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Note: the backend currently lets any authenticated user create/edit these.
        Profile image upload is not supported by the backend yet (read-only field).
      </p>

      {isLoadingInstructors ? (
        <LoadingState className="mt-6" rows={2} />
      ) : instructorsError ? (
        <ErrorState className="mt-6" message={instructorsError} onRetry={fetchInstructors} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No instructors yet.
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={ins.profile_image || undefined} alt={ins.name} />
                        <AvatarFallback>{ins.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{ins.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{ins.title || "—"}</TableCell>
                  <TableCell className="max-w-md whitespace-normal">
                    <span className="line-clamp-2 text-muted-foreground">
                      {ins.bio || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(ins)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(ins)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <InstructorFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        instructor={editing}
      />
    </div>
  );
}
