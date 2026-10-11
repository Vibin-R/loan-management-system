import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';

interface StepNavProps {
  /** Goes to the previous step. Omitted on the first step. */
  onPrevious?: () => void;
  nextLabel: string;
  /** Click handler for Next; omit when Next submits the surrounding form. */
  onNext?: () => void;
  nextDisabled?: boolean;
  /** True while the step is saving: shows a spinner on Next and locks both buttons. */
  busy?: boolean;
}

/** The same Previous / Next footer on every application step. */
export function StepNav({ onPrevious, nextLabel, onNext, nextDisabled, busy }: StepNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
      {onPrevious ? (
        <Button variant="secondary" onClick={onPrevious} disabled={busy}>
          <ArrowLeftIcon className="h-4 w-4" />
          Previous
        </Button>
      ) : (
        <span />
      )}
      <Button
        type={onNext ? 'button' : 'submit'}
        onClick={onNext}
        disabled={nextDisabled}
        loading={busy}
      >
        {nextLabel}
        {!busy && <ArrowRightIcon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
