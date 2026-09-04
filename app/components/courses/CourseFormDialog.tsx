"use client";

import { useState } from "react";
import toast from "react-hot-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseStore } from "../../store/useCourseStore";
import type { Course, CourseLevel, CoursePayload } from "../../types/course";

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  course?: Course | null;
}

const emptyForm = {
  slug: "",
  title: "",
  description: "",
  duration_weeks: "0",
  level: "beginner" as CourseLevel,
  skills: "",
  certificate_name: "",
  order: "0",
  is_active: "true",
};

function formFromCourse(course: Course | null | undefined) {
  if (!course) return emptyForm;
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    duration_weeks: String(course.duration_weeks),
    level: course.level,
    skills: course.skills.join(", "),
    certificate_name: course.certificate_name,
    order: String(course.order),
    is_active: String(course.is_active),
  };
}

export default function CourseFormDialog({
  open,
  onOpenChange,
  onSaved,
  course,
}: Props) {
  const { createCourse, updateCourse, isSavingCourse, courseSaveError } = useCourseStore();
  const [form, setForm] = useState(() => formFromCourse(course));

  const isEdit = Boolean(course);

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CoursePayload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      duration_weeks: Number(form.duration_weeks) || 0,
      level: form.level,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      certificate_name: form.certificate_name.trim(),
      order: Number(form.order) || 0,
      is_active: form.is_active === "true",
    };

    const saved = isEdit
      ? await updateCourse(course!.id, payload)
      : await createCourse(payload);

    if (saved) {
      toast.success(isEdit ? "Course updated" : "Course created");
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "Create course"}</DialogTitle>
          <DialogDescription>
            Save against the live /api/courses/ endpoint.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. Data Analytics Bootcamp"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              required
              placeholder="data-analytics-bootcamp"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of the course"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={form.duration_weeks}
                onChange={(e) => set("duration_weeks", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set("order", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(v) => set("level", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Active</Label>
              <Select
                value={form.is_active}
                onValueChange={(v) => set("is_active", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="Comma-separated, e.g. Python, SQL, Dashboards"
            />
            <p className="text-xs text-muted-foreground">
              Stored as a JSON array.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="certificate_name">Certificate name</Label>
            <Input
              id="certificate_name"
              value={form.certificate_name}
              onChange={(e) => set("certificate_name", e.target.value)}
              placeholder="As printed on the certificate"
            />
          </div>

          {courseSaveError && (
            <p className="text-sm text-red-600">{courseSaveError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingCourse}>
              {isSavingCourse ? "Saving..." : isEdit ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
