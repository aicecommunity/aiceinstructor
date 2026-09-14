"use client";

import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEARN_APP_URL } from "../../utils/MyConstants";
import type { Course } from "../../types/course";

// Renders one "Preview certificate" button per certificate the course awards.
// Each button opens the certificate in the learn app (new tab) as a read-only
// preview page: /certificate-preview/<slug>/<definition_index>/.
export default function CertificatePreviewLinks({ course }: { course: Course }) {
  const certificates =
    course.certificates.length > 0
      ? course.certificates
      : [
          {
            name: course.certificate_name || course.title,
            skills: course.skills,
          },
        ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-4">
      <h3 className="text-sm font-medium">Certificates</h3>
      <div className="flex flex-wrap gap-2">
        {certificates.map((cert, index) => (
          <Button key={index} asChild variant="outline" size="sm">
            <a
              href={`${LEARN_APP_URL}/certificate-preview/${course.slug}/${index}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Award className="size-4" />
              Preview: {cert.name}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}