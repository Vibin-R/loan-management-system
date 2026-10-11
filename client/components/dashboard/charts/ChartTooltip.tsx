interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

/** Dark tooltip card used by every chart: a title and one coloured row per series. */
export function ChartTooltipCard({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-40 rounded-xl bg-ink px-3.5 py-3 text-xs text-ink-foreground shadow-xl">
      <p className="mb-2 font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ink-foreground/70">
              <span className="h-3 w-0.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="font-semibold tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
