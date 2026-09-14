"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, HandCoins, Landmark, Receipt, TrendingUp } from "lucide-react";
import { finance } from "../../services/finance";
import type { InstructorFinance } from "../../types/finance";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function SplitBar({ instructorPercent }: { instructorPercent: number }) {
  const platformPercent = 100 - instructorPercent;
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full border border-border">
        <div
          className="flex items-center justify-center bg-[#195C49] text-[10px] font-medium text-white"
          style={{ width: `${instructorPercent}%` }}
          title={`Instructor ${instructorPercent}%`}
        >
          {instructorPercent}%
        </div>
        <div
          className="flex items-center justify-center bg-blue-600 text-[10px] font-medium text-white"
          style={{ width: `${platformPercent}%` }}
          title={`Platform ${platformPercent}%`}
        >
          {platformPercent}%
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#195C49]" /> Instructor {instructorPercent}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-600" /> Platform {platformPercent}%
        </span>
      </div>
    </div>
  );
}

export default function FinanceManager() {
  const [data, setData] = useState<InstructorFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await finance.instructor();
      setData(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? err?.message ?? "Failed to load financial data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState className="mx-auto mt-8 max-w-6xl" rows={3} />;
  if (error || !data) {
    return <ErrorState className="mx-auto mt-8 max-w-6xl" message={error ?? "No data."} onRetry={load} />;
  }

  const paidSeats = data.courses.reduce((sum, c) => sum + c.paid_enrollments, 0);
  const { config } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Wallet className="size-6 text-[#195C49]" /> Finance
          </h1>
          <p className="text-sm text-muted-foreground">
            What each course you teach brings in, and how the revenue split shares it.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="size-3.5" /> {data.courses.length} course
          {data.courses.length === 1 ? "" : "s"} · {paidSeats} paid enrollment
          {paidSeats === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="mt-2 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-800">
        Instructors earn <strong>{config.instructor_percent}%</strong> of every course's
        collections; the platform keeps the remaining {config.platform_percent}%. Amounts are
        from successful {data.currency} payments (live Paystack data).
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Receipt}
          label="Total collections"
          value={formatPrice(data.totals.collections, data.currency)}
          accent="text-[#195C49]"
        />
        <StatCard
          icon={HandCoins}
          label="Your instructor share"
          value={formatPrice(data.totals.instructor_share, data.currency)}
          hint={`${config.instructor_percent}% of collections`}
          accent="text-[#195C49]"
        />
        <StatCard
          icon={Landmark}
          label="Platform share"
          value={formatPrice(data.totals.platform_share, data.currency)}
          hint={`${config.platform_percent}% of collections`}
          accent="text-blue-600"
        />
        <StatCard
          icon={Wallet}
          label="Paid enrollments"
          value={String(paidSeats)}
          hint="Successful purchases"
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How the money flows
        </p>
        <SplitBar instructorPercent={config.instructor_percent} />
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">Per course</h2>
      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Paid enrollments</TableHead>
            <TableHead className="text-right">Collections</TableHead>
            <TableHead className="text-right">Your share</TableHead>
            <TableHead className="text-right">Platform share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No courses assigned to you yet — talk to the platform team about your byline.
              </TableCell>
            </TableRow>
          ) : (
            data.courses.map((course) => (
              <TableRow key={course.course_id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell className="tabular-nums">{course.paid_enrollments}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(course.collections, data.currency)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[#195C49]">
                  {formatPrice(course.instructor_share, data.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatPrice(course.platform_share, data.currency)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}