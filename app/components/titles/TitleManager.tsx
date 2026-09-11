"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTitleStore } from "../../store/useTitleStore";
import { useAuthStore } from "../../store/useAuthStore";
import type { AdministratorTitle } from "../../types/course";
import TitleFormDialog from "./TitleFormDialog";
import ConfirmDeleteTitleDialog from "./ConfirmDeleteTitleDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import AccessDenied from "../AccessDenied";

export default function TitleManager() {
  const { user } = useAuthStore();
  const { titles, isLoadingTitles, titlesError, fetchTitles } = useTitleStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdministratorTitle | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdministratorTitle | null>(null);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  if (user && !user.is_superuser) return <AccessDenied />;

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (t: AdministratorTitle) => {
    setEditing(t);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administrator titles</h1>
          <p className="text-sm text-muted-foreground">
            Ordered roles assigned when an administrator is created. Titles appear
            on certificates (superuser only).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add title
        </Button>
      </div>

      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Superuser-only: only the superuser can create, edit, or remove titles.
        Leave the order blank when creating to auto-assign the next number.
      </p>

      {isLoadingTitles ? (
        <LoadingState className="mt-6" rows={2} />
      ) : titlesError ? (
        <ErrorState className="mt-6" message={titlesError} onRetry={fetchTitles} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {titles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No titles yet. Add one to assign it to administrators.
                </TableCell>
              </TableRow>
            ) : (
              titles.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {t.order}
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(t)}
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

      <TitleFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing}
      />
      <ConfirmDeleteTitleDialog
        title={deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
