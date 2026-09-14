"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEARN_APP_URL } from "../../utils/MyConstants";
import type { Course } from "../../types/course";

// Opens the instructor's own course in the learn app's preview mode, which
// shows every unit unlocked and grades quizzes/practicals without saving them.
// The learner backend enforces that only the course creator (or a superuser)
// is allowed to preview.
export default function CoursePreviewButton({ course }: { course: Course }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={`${LEARN_APP_URL}/learn/preview/${course.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Preview course in the learn app"
      >
        <Eye className="size-4" />
        Preview course
      </a>
    </Button>
  );
}