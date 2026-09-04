import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <ShieldAlert className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Access denied
      </h1>
      <p className="mt-2 max-w-md text-zinc-600">
        This area is for instructors only. Your account does not currently have
        the <span className="font-semibold text-zinc-900">instructor</span> role,
        so you can&apos;t view the instructor dashboard.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        If you believe this is a mistake, contact the AiCE team to request access.
      </p>
    </div>
  );
}
