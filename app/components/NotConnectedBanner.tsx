import { AlertTriangle } from "lucide-react";

interface Props {
  feature: string;
}

/**
 * Reusable banner marking a screen as running on the mock data layer rather
 * than a live backend endpoint. Used on the unit/content authoring screen and
 * intended for reuse on other not-yet-backed screens (per prompt 05/06/07).
 */
export default function NotConnectedBanner({ feature }: Props) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="text-sm text-amber-800">
        <p className="font-medium">Not yet connected to the backend</p>
        <p className="mt-0.5">
          {feature} is currently saved to local mock data. No changes are persisted
          to the server until the real endpoints are available. When they land, only
          the store&apos;s data functions change — the UI stays the same.
        </p>
      </div>
    </div>
  );
}
