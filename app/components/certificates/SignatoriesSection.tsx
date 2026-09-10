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
import type { Signatory } from "../../types/certificates";
import SignatoryFormDialog from "./SignatoryFormDialog";
import ConfirmDeleteSignatoryDialog from "./ConfirmDeleteSignatoryDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

export default function SignatoriesSection() {
  const {
    signatories,
    isLoadingSignatories,
    signatoriesError,
    fetchSignatories,
  } = useCertificateStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Signatory | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Signatory | null>(null);

  useEffect(() => {
    fetchSignatories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (sig: Signatory) => {
    setEditing(sig);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <section className="rounded-md border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Certificate signatories</h2>
          <p className="text-xs text-muted-foreground">
            Everyone who can sign a certificate. Assign them to courses on the
            right. Instructors and administrators appear here automatically using
            their signatory name.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Add signatory
        </Button>
      </div>

      {isLoadingSignatories ? (
        <LoadingState className="mt-4" rows={2} />
      ) : signatoriesError ? (
        <ErrorState className="mt-4" message={signatoriesError} onRetry={fetchSignatories} />
      ) : (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Signatory</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signatories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No signatories yet. Add one to assign it to courses.
                </TableCell>
              </TableRow>
            ) : (
              signatories.map((sig) => (
                <TableRow key={sig.id}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {sig.order}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{sig.name}</p>
                    <p className="flex items-center gap-1.5">
                      {sig.source && (
                        <Badge variant="secondary" className="px-1.5 text-[10px]">
                          {sig.source}
                        </Badge>
                      )}
                      {sig.organization && (
                        <span className="text-xs text-muted-foreground">
                          {sig.organization}
                        </span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                    {sig.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sig.is_active ? "default" : "outline"}>
                      {sig.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(sig)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(sig)}
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

      <SignatoryFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        signatory={editing}
      />

      <ConfirmDeleteSignatoryDialog
        signatory={deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      />
    </section>
  );
}