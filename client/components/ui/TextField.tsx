import { useId } from 'react';

type Appearance = 'default' | 'pill';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /**
   * `pill`: large rounded input that shows the label as its placeholder (the label stays
   * available to screen readers). Used on the login and signup screens.
   */
  appearance?: Appearance;
  /** Content shown inside the input on the right, e.g. a show/hide password button. */
  endAdornment?: React.ReactNode;
}

const INPUT_CLASSES: Record<Appearance, string> = {
  default: 'rounded-md px-3 py-2 text-sm shadow-sm',
  pill: 'h-12 rounded-full px-5 text-[15px] short:h-11',
};

/** A labelled input with its error shown directly underneath and linked for screen readers. */
export function TextField({
  label,
  error,
  hint,
  appearance = 'default',
  endAdornment,
  id,
  className = '',
  placeholder,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;
  const isPill = appearance === 'pill';

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className={isPill ? 'sr-only' : 'block text-sm font-medium'}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          placeholder={placeholder ?? (isPill ? label : undefined)}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`block w-full border bg-surface outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 ${INPUT_CLASSES[appearance]} ${endAdornment ? 'pr-12' : ''} ${error ? 'border-danger' : 'border-border'} ${className}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={`text-xs ${isPill ? 'px-5' : ''} ${error ? 'text-danger' : 'text-muted'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
