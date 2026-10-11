import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Shape = 'rounded' | 'pill';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-primary-strong text-primary-foreground shadow-sm hover:brightness-110',
  secondary: 'border border-border bg-surface text-foreground hover:bg-background',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-foreground hover:bg-background',
};

const SHAPE_CLASSES: Record<Shape, string> = {
  rounded: 'rounded-md px-4 py-2 text-sm',
  pill: 'h-12 rounded-full px-6 text-[15px]',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** `pill` matches the large rounded inputs on the login and signup screens. */
  shape?: Shape;
  /** Shows a spinner and disables the button, e.g. while a request is in flight. */
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  shape = 'rounded',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SHAPE_CLASSES[shape]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
