import { CheckIcon } from '@/components/ui/icons';

export const APPLICATION_STEPS = ['Account', 'Your details', 'Salary slip', 'Choose loan'] as const;

/** Progress across the four application steps. `current` is a 0-based index. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Application progress">
      {APPLICATION_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="space-y-2">
            <div className={`h-1.5 rounded-full ${done || active ? 'bg-primary' : 'bg-border'}`} />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              {done && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
              <span className={active ? 'font-medium' : done ? 'text-foreground' : 'text-muted'}>
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
