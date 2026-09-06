"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseCertificate } from "../../types/course";

const MAX_SKILLS = 7;
const MIN_SKILLS = 1;

interface Props {
  value: CourseCertificate[];
  onChange: (value: CourseCertificate[]) => void;
  onValidityChange: (valid: boolean) => void;
}

export default function CertificatesEditor({
  value,
  onChange,
  onValidityChange,
}: Props) {
  const [skillInputs, setSkillInputs] = useState<string[]>(
    value.map(() => "")
  );

  const updateCertificate = (
    index: number,
    patch: Partial<CourseCertificate>
  ) => {
    onChange(
      value.map((cert, i) => (i === index ? { ...cert, ...patch } : cert))
    );
  };

  const addCertificate = () => {
    onChange([...value, { name: "", skills: [] }]);
    setSkillInputs((s) => [...s, ""]);
  };

  const removeCertificate = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setSkillInputs((s) => s.filter((_, i) => i !== index));
  };

  const commitSkill = (certIndex: number) => {
    const text = skillInputs[certIndex]?.trim();
    if (!text) return;
    const cert = value[certIndex];
    if (!cert || cert.skills.length >= MAX_SKILLS) return;
    if (cert.skills.includes(text)) {
      setSkillInputs((s) => s.map((v, i) => (i === certIndex ? "" : v)));
      return;
    }
    updateCertificate(certIndex, { skills: [...cert.skills, text] });
    setSkillInputs((s) => s.map((v, i) => (i === certIndex ? "" : v)));
  };

  const removeSkill = (certIndex: number, skill: string) => {
    const cert = value[certIndex];
    if (!cert) return;
    updateCertificate(certIndex, {
      skills: cert.skills.filter((s) => s !== skill),
    });
  };

  // Report aggregate validity to the parent.
  const totalSkills = value.reduce((n, c) => n + c.skills.length, 0);
  const isValid =
    value.length > 0 &&
    value.every(
      (cert) =>
        cert.name.trim().length > 0 &&
        cert.skills.length >= MIN_SKILLS &&
        cert.skills.length <= MAX_SKILLS
    );

  // Call onValidityChange whenever it changes (guard against infinite loops).
  const [lastReported, setLastReported] = useState<boolean | null>(null);
  if (lastReported !== isValid) {
    setLastReported(isValid);
    onValidityChange(isValid);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <Label>
          Certificates *{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (min 1)
          </span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCertificate}
        >
          <Plus className="size-4" /> Add Certificate
        </Button>
      </div>

      {value.map((cert, certIndex) => {
        const canRemove = value.length > 1;
        return (
          <Card key={certIndex} size="sm">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm text-muted-foreground">
                Certificate {certIndex + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canRemove}
                onClick={() => removeCertificate(certIndex)}
                aria-label={`Remove certificate ${certIndex + 1}`}
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor={`cert-name-${certIndex}`}>
                  Certificate Name *
                </Label>
                <Input
                  id={`cert-name-${certIndex}`}
                  value={cert.name}
                  onChange={(e) =>
                    updateCertificate(certIndex, { name: e.target.value })
                  }
                  placeholder="e.g. Software Engineering Fellowship"
                />
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>Skills *</Label>
                  <span className="text-xs text-muted-foreground">
                    {cert.skills.length}/{MAX_SKILLS}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cert.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(certIndex, skill)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Remove skill ${skill}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillInputs[certIndex] ?? ""}
                    onChange={(e) =>
                      setSkillInputs((s) =>
                        s.map((v, i) => (i === certIndex ? e.target.value : v))
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitSkill(certIndex);
                      }
                    }}
                    placeholder="Type a skill and press Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      cert.skills.length >= MAX_SKILLS ||
                      !skillInputs[certIndex]?.trim()
                    }
                    onClick={() => commitSkill(certIndex)}
                  >
                    <Plus className="size-4" /> Add Skill
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cert.skills.length >= MAX_SKILLS
                    ? "Maximum 7 skills reached."
                    : `Add ${MIN_SKILLS}–${MAX_SKILLS} skills.`}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {totalSkills <= 0 && value.length > 0 && (
        <p className="text-xs text-amber-600">
          Add at least one skill to each certificate.
        </p>
      )}
    </div>
  );
}