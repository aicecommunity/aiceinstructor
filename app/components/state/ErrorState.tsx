import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Consistent error presentation used across every screen (prompt 08). Renders a
 * red alert with an optional retry action.
 */
export default function ErrorState({ message, onRetry, className = "" }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
