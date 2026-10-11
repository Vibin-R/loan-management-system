/** Placeholder rows shown while a list loads, sized like the real rows to avoid layout jumps. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface p-4">
          <div className="h-4 w-1/3 rounded bg-background" />
          <div className="mt-3 h-3 w-2/3 rounded bg-background" />
          <div className="mt-2 h-3 w-1/2 rounded bg-background" />
        </div>
      ))}
    </div>
  );
}
