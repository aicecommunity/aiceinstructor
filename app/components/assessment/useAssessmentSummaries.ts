"use client";

import { useEffect, useMemo } from "react";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import type { CalendarUnit } from "../../types/curriculum";

/**
 * Preloads the assessment summary (settings + quiz/practical question counts)
 * for a list of units into the assessment store. Idempotent per unit id and
 * keyed on the sorted unit-id list rather than the array identity, so mounting
 * it on both the Units and Assessments screens (which rebuild the array on
 * every render) does not re-fetch each render.
 */
export function useAssessmentSummaries(units: CalendarUnit[]): void {
  const loadAssessment = useAssessmentStore((s) => s.loadAssessment);

  const unitsByKey = useMemo(() => {
    const map = new Map<number, CalendarUnit>();
    for (const unit of units) map.set(unit.id, unit);
    return map;
  }, [units]);

  const key = Array.from(unitsByKey.keys())
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (!key) return;
    for (const id of key.split(",").map(Number)) {
      const unit = unitsByKey.get(id);
      if (unit) void loadAssessment(unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loadAssessment]);
}