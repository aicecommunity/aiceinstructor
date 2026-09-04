"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInstructorStore } from "../../store/useInstructorStore";
import type { Instructor, InstructorPayload } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}

export default function InstructorFormDialog({
  open,
  onOpenChange,
  instructor,
}: Props) {
  const { createInstructor, updateInstructor, isSavingInstructor, instructorSaveError } =
    useInstructorStore();
  const [name, setName] = useState(instructor?.name ?? "");
  const [title, setTitle] = useState(instructor?.title ?? "");
  const [bio, setBio] = useState(instructor?.bio ?? "");

  const isEdit = Boolean(instructor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: InstructorPayload = {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
    };

    const saved = isEdit
      ? await updateInstructor(instructor!.id, payload)
      : await createInstructor(payload);

    if (saved) {
      toast.success(isEdit ? "Instructor updated" : "Instructor created");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit instructor" : "Add instructor"}</DialogTitle>
          <DialogDescription>
            Manage the course byline (live /api/courses/instructors/).
          </DialogDescription>
        </DialogHeader>

        {isEdit && instructor?.profile_image && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={instructor.profile_image} alt={instructor.name} />
              <AvatarFallback>{instructor.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Profile image shown read-only. Upload is not supported by the backend
              (profile_image is a read-only field).
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ins-name">Name *</Label>
            <Input
              id="ins-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Dr. Jane Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ins-title">Title</Label>
            <Input
              id="ins-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Founder, Director"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ins-bio">Bio</Label>
            <Textarea
              id="ins-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio shown on the course byline"
            />
          </div>

          {instructorSaveError && (
            <p className="text-sm text-red-600">{instructorSaveError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingInstructor}>
              {isSavingInstructor ? "Saving..." : isEdit ? "Save changes" : "Add instructor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
