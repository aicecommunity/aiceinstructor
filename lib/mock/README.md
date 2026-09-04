# `lib/mock/` — Mock data convention

This directory holds mock data and a mock API layer for instructor-app features
that are **not yet backed by a real backend endpoint**.

The backend (see `report/instructor-app/plan/01-backend-content-model.md`) has
essentially **no instructor-facing mutation endpoints** for courses, units,
assessments, or student records. Until those exist, we author UI against mock data
so feature work isn't blocked.

## The rule — mocked and real calls are never ambiguous

- **Real API layer**: `app/services/api.ts` (the axios instance + 401-refresh
  interceptor). All real calls go through it.
- **Mock layer**: `lib/mock/mockApi.ts`. It exports functions with the **same shape
  and signature** as the eventual real service, so swapping a store from mock to
  real is a one-line change.
- **Per-store switch**: every store that can run against mock data has a top-level
  `const USE_MOCK = true;` (or a similar `isMock` flag). This is the single source
  of truth telling a reader whether `fetchCourses` hits `mockApi` or `api`.

## How to use

1. Define the mock data in `lib/mock/data.ts` (or a per-domain file, e.g.
   `lib/mock/courses.ts`).
2. Define the mock API function in `lib/mock/mockApi.ts`, e.g.:

   ```ts
   // lib/mock/mockApi.ts
   import { coursesData } from "./data";

   export const mockCoursesApi = {
     list: async () => ({ data: coursesData }),
   };
   ```

3. In the store, gate on `USE_MOCK`:

   ```ts
   const USE_MOCK = true;

   const fetchCourses = async (get, set) => {
     set({ isLoadingCourses: true, coursesError: null });
     try {
       const { data } = USE_MOCK
         ? await mockApi.courses.list()
         : await services.courses.list();
       set({ courses: data, isLoadingCourses: false });
     } catch (err: any) {
       set({ coursesError: err.message, isLoadingCourses: false });
     }
   };
   ```

## Naming

- Mock API functions are prefixed `mock` (e.g. `mockApi.courses.list`).
- Mock data files hold `*Data` exports (e.g. `coursesData`).
- The `USE_MOCK` flag lives at the top of each store file. A store using mock data
  MUST declare it; a store using only real data must NOT define it (so its absence
  means "real").

## Why not fetch-mock or MSW?

This scaffold keeps it dependency-free and intentionally simple: a hand-written
mock layer that mirrors the service layer. It can be swapped for MSW later if the
mock surface grows large enough to warrant it.

## Files

- `mockApi.ts` — the mock API surface (parallel to `app/services/*`).
- `data.ts` — the mock data itself.
- `README.md` — this document.
