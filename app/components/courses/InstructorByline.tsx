"use client";

import { Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Course } from "../../types/course";

// NOTE on backend gap (prompt 03, verified from aicebackend/courses/serializers.py):
// CourseSerializer declares `instructors = InstructorSerializer(many=True, read_only=True)`,
// so there is NO writable API path to attach/detach Instructors to/from a Course.
// This panel therefore shows the bylines read-only. Attach/detach is listed as
// backend hardening, not a frontend bug.

export default function InstructorByline({ course }: { course: Course }) {
  const bylines = course.instructors ?? [];

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Instructors (bylines)</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          <span>
            Attach/detach requires backend support — shown read-only for now.
          </span>
        </div>
      </div>

      {bylines.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No instructors attached to this course yet.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {bylines.map((ins) => (
            <li
              key={ins.id}
              className="flex items-center gap-3 rounded-md border bg-muted/30 p-2"
            >
              <Avatar>
                <AvatarImage src={ins.profile_image || undefined} alt={ins.name} />
                <AvatarFallback>{ins.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">{ins.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ins.title || "No title"}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                Byline
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
