import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  rows?: number;
  height?: number;
  className?: string;
}

/**
 * Consistent loading placeholder used across every screen (prompt 08,
 * normalization pass). Takes the place of ad-hoc `<Skeleton>` stacks.
 */
export default function LoadingState({ rows = 3, height = 12, className = "" }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ height }} />
      ))}
    </div>
  );
}
