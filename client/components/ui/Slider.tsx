import { useId } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Formats the current value and the min/max labels. */
  format: (value: number) => string;
}

/** A labelled range slider showing its current value and limits. Keyboard accessible. */
export function Slider({ label, value, min, max, step, onChange, format }: SliderProps) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="text-lg font-semibold tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format(value)}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-primary"
        style={{
          background: `linear-gradient(to right, var(--primary) ${percent}%, var(--border) ${percent}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
