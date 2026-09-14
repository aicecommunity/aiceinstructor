"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Landmark,
  HandCoins,
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Scale,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { finance } from "../../services/finance";
import type {
  FinancialAnalysis,
  RevenueRole,
  RevenueShare,
} from "../../types/finance";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AccessDenied from "../AccessDenied";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import RoleFormDialog from "./RoleFormDialog";
import ShareFormDialog from "./ShareFormDialog";

const VALIDATION_STYLES: Record<string, { tone: string; label: string }> = {
  balanced: {
    tone: "border-green-200 bg-green-50 text-green-800",
    label: "Balanced — the platform's share is fully allocated.",
  },
  under_allocated: {
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    label: "Under-allocated — some platform revenue is still unallocated.",
  },
  over_allocated: {
    tone: "border-red-200 bg-red-50 text-red-800",
    label: "Over-allocated — assigned percentages exceed the platform's share.",
  },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function FinancialAnalysisManager() {
  const { user } = useAuthStore();

  const [data, setData] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [configValue, setConfigValue] = useState<string>("50");
  const [savingConfig, setSavingConfig] = useState(false);

  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RevenueRole | null>(null);
  const [shareFormOpen, setShareFormOpen] = useState(false);
  const [editingShare, setEditingShare] = useState<RevenueShare | null>(null);
  const [deleteRole, setDeleteRole] = useState<RevenueRole | null>(null);
  const [deleteShare, setDeleteShare] = useState<RevenueShare | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await finance.analysis();
      setData(res.data);
      setConfigValue(String(res.data.config.instructor_percent));
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? err?.message ?? "Failed to load financial analysis."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flowSegments = useMemo(() => {
    if (!data) return [];
    const { config, totals, member_totals, validation } = data;
    const memberSum = member_totals.reduce((s, m) => s + m.amount, 0);
    const unallocatedAmount = Math.max(totals.platform_share - memberSum, 0);
    return [
      {
        label: `Instructor (${config.instructor_percent}%)`,
        percent: Number(config.instructor_percent),
        amount: totals.instructor_share,
        color: "#195C49",
      },
      ...member_totals.map((m) => ({
        label: m.label,
        percent: Number(m.percent),
        amount: m.amount,
        color: m.role_color || "#64748B",
      })),
      {
        label: `Unallocated (${Number(validation.unallocated_percent)}%)`,
        percent: Math.max(Number(validation.unallocated_percent), 0),
        amount: unallocatedAmount,
        color: "#CBD5E1",
      },
    ].filter((s) => s.percent > 0);
  }, [data]);

  if (user && !user.is_superuser) {
    return <AccessDenied />;
  }

  if (loading) return <LoadingState className="mx-auto mt-8 max-w-6xl" rows={4} />;
  if (error || !data) {
    return <ErrorState className="mx-auto mt-8 max-w-6xl" message={error ?? "No data."} onRetry={load} />;
  }

  const { config, totals, validation } = data;
  const validationMeta = VALIDATION_STYLES[validation.status] ?? VALIDATION_STYLES.balanced;

  const handleSaveConfig = async () => {
    const value = Number(configValue);
    if (Number.isNaN(value) || value <= 0 || value >= 100) {
      toast.error("Instructor percent must be between 0 and 100.");
      return;
    }
    setSavingConfig(true);
    try {
      await finance.updateConfig(value);
      toast.success("Revenue split updated");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Failed to update config.");
    } finally {
      setSavingConfig(false);
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleFormOpen(true);
  };
  const openEditRole = (role: RevenueRole) => {
    setEditingRole(role);
    setRoleFormOpen(true);
  };
  const openCreateShare = () => {
    setEditingShare(null);
    setShareFormOpen(true);
  };
  const openEditShare = (share: RevenueShare) => {
    setEditingShare(share);
    setShareFormOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!deleteRole) return;
    setDeleting(true);
    try {
      await finance.deleteRole(deleteRole.id);
      toast.success("Role deleted");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Failed to delete role.");
    } finally {
      setDeleting(false);
      setDeleteRole(null);
    }
  };

  const confirmDeleteShare = async () => {
    if (!deleteShare) return;
    setDeleting(true);
    try {
      await finance.deleteShare(deleteShare.id);
      toast.success("Share deleted");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Failed to delete share.");
    } finally {
      setDeleting(false);
      setDeleteShare(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="size-6 text-[#195C49]" /> Financial Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            How every naira flows: instructor, platform, and the people behind the platform.
          </p>
        </div>
        <Badge variant="outline">{data.roles.length} role{data.roles.length === 1 ? "" : "s"} · {data.shares.length} member{data.shares.length === 1 ? "" : "s"}</Badge>
      </div>

      <p className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${validationMeta.tone}`}>
        <Scale className="size-3.5 shrink-0" />
        <span>
          {validationMeta.label} Roles hold {Number(validation.allocated_percent)}% of the
          platform&apos;s {Number(validation.platform_percent)}% (unallocated{" "}
          {Math.max(Number(validation.unallocated_percent), 0)}%).
        </span>
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Money flow — every course&apos;s collections
        </p>
        <div className="flex h-6 w-full overflow-hidden rounded-full border border-border">
          {flowSegments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-center text-[10px] font-medium text-white"
              style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
              title={`${segment.label} — ${formatPrice(segment.amount, "NGN")}`}
            >
              {segment.percent}%
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {flowSegments.map((segment) => (
            <span key={segment.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="font-medium tabular-nums">
                {formatPrice(segment.amount, "NGN")}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Receipt className="size-4 text-[#195C49]" /> Total collections
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(totals.collections, "NGN")}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HandCoins className="size-4 text-[#195C49]" /> Instructor share
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(totals.instructor_share, "NGN")}
          </div>
          <div className="text-xs text-muted-foreground">{Number(config.instructor_percent)}%</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Landmark className="size-4 text-blue-600" /> Platform share
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(totals.platform_share, "NGN")}
          </div>
          <div className="text-xs text-muted-foreground">{Number(config.platform_percent)}%</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Revenue split config
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <label htmlFor="instructor-pct" className="text-xs font-medium text-muted-foreground">
              Instructor percent (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="instructor-pct"
                type="number"
                step="0.01"
                min={0.01}
                max={99.99}
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                className="w-28"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveConfig}
                disabled={savingConfig}
              >
                {savingConfig ? "Saving…" : "Save split"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The platform keeps the remaining {100 - Number(configValue || 0)}%. Instructors see
            this on their Finance page automatically.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                <PiggyBank className="size-4 text-[#195C49]" /> Revenue roles
              </h2>
              <p className="text-xs text-muted-foreground">
                Each role holds a percent of total revenue and its members split it.
              </p>
            </div>
            <Button size="sm" onClick={openCreateRole}>
              <Plus className="size-4" /> Role
            </Button>
          </div>

          {data.roles.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No roles yet. Add roles like "Founder" or "Platform Operations", then assign
              members to them.
            </p>
          ) : (
            <div className="[&>div]:h-[360px] [&>div]:overflow-y-auto">
              <Table>
                <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white">
                  <TableRow>
                    <TableHead className="w-14">Colour</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">% of total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <span
                          className="inline-block size-4 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: role.color || "#64748B" }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{role.member_count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(role.percent)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEditRole(role)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteRole(role)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                <PiggyBank className="size-4 text-[#195C49]" /> Members & shares
              </h2>
              <p className="text-xs text-muted-foreground">
                Who gets paid from the platform's share, and how much.
              </p>
            </div>
            <Button size="sm" onClick={openCreateShare} disabled={data.roles.length === 0}>
              <Plus className="size-4" /> Member
            </Button>
          </div>

          {data.shares.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No members assigned yet. Add the people who should share the platform revenue.
            </p>
          ) : (
            <div className="[&>div]:h-[360px] [&>div]:overflow-y-auto">
              <Table>
                <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Overall</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.shares.map((share) => {
                    const overall = data.member_totals.find((m) => m.share_id === share.id);
                    return (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700">
                              {initials(share.profile.full_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{share.label || share.profile.full_name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {share.profile.email ?? share.profile.aice_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: share.role.color || "#64748B" }}
                          >
                            {share.role.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {overall ? `${Number(overall.percent)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {overall ? formatPrice(overall.amount, "NGN") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => openEditShare(share)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteShare(share)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">Per course</h2>
      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Paid enrollments</TableHead>
            <TableHead className="text-right">Collections</TableHead>
            <TableHead className="text-right">Instructor</TableHead>
            <TableHead className="text-right">To members</TableHead>
            <TableHead className="text-right">Platform left</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No courses in the system yet.
              </TableCell>
            </TableRow>
          ) : (
            data.courses.map((course) => {
              const toMembers = course.members.reduce((sum, m) => sum + m.amount, 0);
              const platformLeft = Math.max(course.platform_share - toMembers, 0);
              return (
                <TableRow key={course.course_id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="tabular-nums">{course.paid_enrollments}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(course.collections, "NGN")}</TableCell>
                  <TableCell className="text-right tabular-nums text-[#195C49]">
                    {formatPrice(course.instructor_share, "NGN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(toMembers, "NGN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatPrice(platformLeft, "NGN")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <RoleFormDialog
        open={roleFormOpen}
        onOpenChange={setRoleFormOpen}
        role={editingRole}
        platformPercent={Number(config.platform_percent)}
        allocatedPercent={Number(validation.allocated_percent)}
        onSaved={load}
      />
      <ShareFormDialog
        open={shareFormOpen}
        onOpenChange={setShareFormOpen}
        roles={data.roles}
        share={editingShare}
        onSaved={load}
      />
      <ConfirmDialog
        open={deleteRole !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteRole(null);
        }}
        title="Delete revenue role?"
        description={`This removes the "${deleteRole?.name}" role. Members currently assigned to it will lose their share — reassign them before deleting.`}
        loading={deleting}
        onConfirm={confirmDeleteRole}
      />
      <ConfirmDialog
        open={deleteShare !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteShare(null);
        }}
        title="Remove member from the split?"
        description={`${deleteShare?.profile.full_name} will no longer be paid from the platform's share.`}
        loading={deleting}
        onConfirm={confirmDeleteShare}
      />
    </div>
  );
}