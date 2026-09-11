"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCertificateStore } from "../../store/useCertificateStore";
import type { CertificateTemplate } from "../../types/certificates";
import TemplateFormDialog from "./TemplateFormDialog";
import ConfirmDeleteTemplateDialog from "./ConfirmDeleteTemplateDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

const TYPE_LABELS: Record<string, string> = {
  "2": "2 signatures",
  "3": "3 signatures",
};

export default function TemplatesSection() {
  const {
    templates,
    isLoadingTemplates,
    templatesError,
    fetchTemplates,
  } = useCertificateStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CertificateTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (tpl: CertificateTemplate) => {
    setEditing(tpl);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <section className="rounded-md border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Certificate templates</h2>
          <p className="text-xs text-muted-foreground">
            The background images that layouts are rendered on. One template per
            certificate style: with two or three signature slots.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Add template
        </Button>
      </div>

      {isLoadingTemplates ? (
        <LoadingState className="mt-4" rows={2} />
      ) : templatesError ? (
        <ErrorState className="mt-4" message={templatesError} onRetry={fetchTemplates} />
      ) : (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">S/N</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Signature layout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No templates yet. Add one to render certificates from.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((tpl, index) => (
                <TableRow key={tpl.id}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {tpl.image_url ? (
                      <a
                        href={tpl.image_url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open ${tpl.name} image`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tpl.image_url}
                          alt={tpl.name}
                          className="h-12 w-20 rounded border bg-white object-contain transition hover:opacity-80"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABELS[tpl.signature_type] ?? tpl.signature_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tpl.is_active ? "default" : "outline"}>
                      {tpl.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(tpl)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(tpl)}
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

      <TemplateFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editing}
      />

      <ConfirmDeleteTemplateDialog
        template={deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      />
    </section>
  );
}