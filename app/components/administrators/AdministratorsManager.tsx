"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdministratorStore } from "../../store/useAdministratorStore";
import { useAuthStore } from "../../store/useAuthStore";
import type { Administrator } from "../../types/course";
import AdministratorFormDialog from "./AdministratorFormDialog";
import ConfirmDeleteAdministratorDialog from "./ConfirmDeleteAdministratorDialog";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import AccessDenied from "../AccessDenied";

export default function AdministratorsManager() {
  const { user } = useAuthStore();

  const {
    administrators,
    isLoadingAdministrators,
    administratorsError,
    fetchAdministrators,
  } = useAdministratorStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Administrator | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Administrator | null>(null);

  useEffect(() => {
    fetchAdministrators();
  }, [fetchAdministrators]);

  // The administrator registry is system-wide: superusers only.
  if (user && !user.is_superuser) {
    return <AccessDenied />;
  }

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (admin: Administrator) => {
    setEditing(admin);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administrators</h1>
          <p className="text-sm text-muted-foreground">
            Senior instructors with a title. Each gets access to the same instructor
            features as an instructor (live /api/courses/administrators/, superuser only).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add administrator
        </Button>
      </div>

      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Superuser-only: only the superuser can add, edit, or remove administrators.
        Administrators use the instructor app like instructors do.
      </p>

      {isLoadingAdministrators ? (
        <LoadingState className="mt-6" rows={2} />
      ) : administratorsError ? (
        <ErrorState className="mt-6" message={administratorsError} onRetry={fetchAdministrators} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S/N</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No administrators yet.
                </TableCell>
              </TableRow>
            ) : (
              administrators.map((admin, index) => (
                <TableRow key={admin.id}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
<div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{admin.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          {admin.signatory_name && (
                            <p className="text-xs text-muted-foreground">
                              Signs as {admin.signatory_name}
                            </p>
                          )}
                          {admin.signature_image && (
                            <img
                              src={admin.signature_image}
                              alt="Signature"
                              className="mt-1 h-10 w-auto rounded border bg-white p-0.5"
                            />
                          )}
                        </div>
                      </div>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal">
                    <span className="line-clamp-2 text-muted-foreground">
                      {admin.email || "—"}
                    </span>
                  </TableCell>
                  <TableCell>{admin.title || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(admin)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(admin)}
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

      <AdministratorFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        administrator={editing}
      />

      <ConfirmDeleteAdministratorDialog
        administrator={deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      />
    </div>
  );
}