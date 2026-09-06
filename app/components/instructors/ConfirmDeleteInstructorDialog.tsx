"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInstructorStore } from "../../store/useInstructorStore";
import type { Instructor } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
}

export default function ConfirmDeleteInstructorDialog({
  open,
  onOpenChange,
  instructor,
}: Props) {
  const { deleteInstructor } = useInstructorStore();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!instructor) return;
    setDeleting(true);
    await deleteInstructor(instructor.id);
    setDeleting(false);
    toast.success("Instructor deleted");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !deleting) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete instructor?</DialogTitle>
          <DialogDescription>
            This removes the instructor byline and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {instructor && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
            <Avatar>
              <AvatarImage src={instructor.profile_image || undefined} alt={instructor.name} />
              <AvatarFallback>{instructor.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">{instructor.name}</p>
              <p className="text-xs text-muted-foreground">
                {instructor.title || "No title"} · {instructor.course_count}{" "}
                {instructor.course_count === 1 ? "course" : "courses"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {deleting ? "Deleting..." : "Delete instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}