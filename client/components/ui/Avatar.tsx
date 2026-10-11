const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

interface AvatarProps {
  name: string;
  /** Tailwind background + text classes, e.g. a status tint. */
  tone?: string;
  className?: string;
}

/** Round initials badge for a person. */
export function Avatar({ name, tone = 'bg-primary/10 text-primary', className = '' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
