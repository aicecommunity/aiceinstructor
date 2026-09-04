"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import { Info, Users } from "lucide-react";
import { useCohortStore } from "../../store/useCohortStore";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Cohort } from "../../types/enrollment";
import LoadingState from "../state/LoadingState";
import ErrorState from "../state/ErrorState";

export default function CohortsManager() {
  const {
    cohorts,
    isLoadingCohorts,
    cohortsError,
    members,
    membersCount,
    isLoadingMembers,
    membersError,
    fetchCohorts,
    fetchMembers,
  } = useCohortStore();

  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  const expanding = (cohort: Cohort) => {
    if (expanded === cohort.id) {
      setExpanded(null);
      return;
    }
    setExpanded(cohort.id);
    fetchMembers(cohort.id, 1, 50);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const displayMembers = members;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cohorts</h1>
        <p className="text-sm text-muted-foreground">
          Browse cohorts and their membership (read-only).
        </p>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Read-only for now. Note: the members endpoint filters to role=&quot;student&quot;
          server-side, and that role does not currently exist in the backend&apos;s role
          choices — so member lists may be empty until that gap is addressed.
        </span>
      </p>

      {isLoadingCohorts ? (
        <LoadingState className="mt-6" rows={2} />
      ) : cohortsError ? (
        <ErrorState className="mt-6" message={cohortsError} onRetry={fetchCohorts} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Program / Course</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No cohorts yet.
                </TableCell>
              </TableRow>
            ) : (
              cohorts.map((cohort) => (
                <Fragment key={cohort.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => expanding(cohort)}
                  >
                    <TableCell className="font-medium">{cohort.name}</TableCell>
                    <TableCell>{cohort.enrollment_name || cohort.enrollment_code}</TableCell>
                    <TableCell>{formatDate(cohort.start_date)}</TableCell>
                    <TableCell>{cohort.end_date ? formatDate(cohort.end_date) : "—"}</TableCell>
                    <TableCell>
                      {cohort.available ? (
                        <Badge>Open</Badge>
                      ) : cohort.is_active ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Ended</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {cohort.capacity === 0
                        ? "Unlimited"
                        : `${cohort.remaining_slots ?? 0} / ${cohort.capacity}`}
                    </TableCell>
                    <TableCell>{cohort.progress}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Users className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded === cohort.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/20">
                        <div className="py-2">
                          <p className="mb-3 text-sm font-medium">
                            Members ({membersCount})
                          </p>
                          {isLoadingMembers ? (
                            <LoadingState rows={1} height={20} />
                          ) : membersError ? (
                            <ErrorState message={membersError} />
                          ) : displayMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No members returned. This is likely the backend
                              role=&quot;student&quot; filter gap mentioned above.
                            </p>
                          ) : (
                            <ul className="grid gap-2 md:grid-cols-2">
                              {displayMembers.map((m) => (
                                <li
                                  key={m.user_id}
                                  className="flex items-center gap-3 rounded-md border bg-background p-2"
                                >
                                  <Avatar>
                                    <AvatarImage src={m.profile_picture || undefined} alt={m.full_name} />
                                    <AvatarFallback>
                                      {m.full_name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">{m.full_name}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      @{m.username}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
