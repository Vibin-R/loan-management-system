import { CheckIcon } from '@/components/ui/icons';

export const APPLICATION_STEPS = ['Account', 'Your details', 'Salary slip', 'Choose loan'] as const;

interface StepperProps {
  /** 0-based index of the step on screen. */
  current: number;
  /** Steps the user may jump to (e.g. finished ones). Those render as buttons. */
  canSelect?: (index: number) => boolean;
  onSelect?: (index: number) => void;
}

/**
 * Progress across the four application steps: numbered circles joined by a line. Finished
 * steps show a tick and are clickable, so the borrower can jump back (or forward again).
 */
export function Stepper({ current, canSelect, onSelect }: StepperProps) {
  return (
    <ol className="flex items-start" aria-label="Application progress">
      {APPLICATION_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const selectable = !active && Boolean(onSelect && canSelect?.(i));
        const last = i === APPLICATION_STEPS.length - 1;

        const circle = (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              active
                ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                : done || selectable
                  ? 'bg-primary/10 text-primary'
                  : 'border border-border bg-surface text-muted'
            } ${selectable ? 'group-hover:bg-primary group-hover:text-primary-foreground' : ''}`}
          >
            {done || (selectable && !active) ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </span>
        );
        const text = (
          <span
            className={`hidden text-sm sm:block ${
              active ? 'font-medium text-foreground' : done ? 'text-foreground' : 'text-muted'
            } ${selectable ? 'group-hover:text-primary' : ''}`}
          >
            {label}
          </span>
        );

        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center ${last ? '' : 'flex-1'}`}
          >
            {selectable ? (
              <button
                type="button"
                onClick={() => onSelect?.(i)}
                aria-label={`Go to step ${i + 1}: ${label}`}
                className="group flex items-center gap-3 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {circle}
                {text}
              </button>
            ) : (
              <span className="flex items-center gap-3 pr-2">
                {circle}
                {text}
              </span>
            )}
            {!last && (
              <span
                aria-hidden="true"
                className={`mx-2 h-0.5 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-border'}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
