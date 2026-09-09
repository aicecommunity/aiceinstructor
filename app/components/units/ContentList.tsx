"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, FileText, Link2, Pencil, Play, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnitStore } from "../../store/useUnitStore";
import type { CalendarUnit, CalendarUnitContent } from "../../types/curriculum";
import ContentFormDialog from "./ContentFormDialog";

const TYPE_ICON: Record<CalendarUnitContent["content_type"], LucideIcon> = {
  video: Play,
  pdf: FileText,
  link: Link2,
};

interface Props {
  enrollmentId: number;
  unit: CalendarUnit;
}

export default function ContentList({ enrollmentId, unit }: Props) {
  const { deleteContent, moveContent, isSavingContent } = useUnitStore();
  const [dialog, setDialog] = useState<{ open: boolean; content?: CalendarUnitContent | null }>({
    open: false,
    content: null,
  });

  const sortedContents = [...unit.contents].sort((a, b) => a.order - b.order);

  const openCreate = () => setDialog({ open: true, content: null });
  const openEdit = (content: CalendarUnitContent) => setDialog({ open: true, content });
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const handleDelete = async (content: CalendarUnitContent) => {
    if (!confirm(`Delete content "${content.title}"?`)) return;
    await deleteContent(enrollmentId, unit.id, content.id);
    toast.success("Content deleted");
  };

  const handleMove = async (content: CalendarUnitContent, direction: -1 | 1) => {
    await moveContent(enrollmentId, unit.id, content.id, direction);
  };

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Content</span>
        <Button size="sm" variant="outline" onClick={openCreate} disabled={isSavingContent}>
          Add content
        </Button>
      </div>

      {sortedContents.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No content yet. Add a video, PDF, or link.
        </p>
      ) : (
        <ul className="divide-y">
          {sortedContents.map((item, index) => {
            const Icon = TYPE_ICON[item.content_type];
            return (
              <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-2 break-words text-sm font-medium sm:truncate sm:whitespace-nowrap">
                        {item.title}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline"
                    >
                      {item.url}
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:ml-auto sm:shrink-0 sm:gap-x-3">
                  <Badge variant="outline" className="shrink-0">{item.content_type}</Badge>
                  {item.is_required && <Badge className="shrink-0">Required</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {item.duration_minutes != null ? `${item.duration_minutes} min` : "—"}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-1.5"
                      disabled={index === 0}
                      onClick={() => handleMove(item, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-1.5"
                      disabled={index === sortedContents.length - 1}
                      onClick={() => handleMove(item, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="px-1.5" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="px-1.5" onClick={() => handleDelete(item)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ContentFormDialog
        key={dialog.content?.id ?? "new"}
        open={dialog.open}
        onOpenChange={close}
        enrollmentId={enrollmentId}
        unitId={unit.id}
        content={dialog.content}
      />
    </div>
  );
}
