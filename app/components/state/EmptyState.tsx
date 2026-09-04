import { Inbox } from "lucide-react";

interface Props {
  message: string;
  className?: string;
}

/**
 * Consistent empty-state presentation used across every screen (prompt 08).
 * Renders a dashed, centered callout for "no data yet" cases.
 */
export default function EmptyState({ message, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground ${className}`}
    >
      <Inbox className="size-5 text-muted-foreground/70" />
      <p>{message}</p>
    </div>
  );
}
