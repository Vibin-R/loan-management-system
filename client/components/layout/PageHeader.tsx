import { CalendarIcon } from '@/components/ui/icons';

const todayLabel = () =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

interface PageHeaderProps {
  title: string;
  subtitle: string;
  /** Extra controls shown before the date, e.g. a primary action. */
  actions?: React.ReactNode;
}

/** Page title with a short subtitle, and today's date on the right. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted">
        {actions}
        <span suppressHydrationWarning>{todayLabel()}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground">
          <CalendarIcon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}
