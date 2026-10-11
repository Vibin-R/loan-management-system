'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarIcon, ChevronRightIcon } from './icons';

/** A calendar date as YYYY-MM-DD (no time zone), the format the API uses. */
type ISODate = string;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (y: number, m: number, d: number): ISODate => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y: y!, m: m! - 1, d: d! };
};
const todayISO = (): ISODate =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const display = (iso: string) => {
  const { y, m, d } = parse(iso);
  return `${d} ${MONTHS[m]!.slice(0, 3)} ${y}`;
};

interface DateFieldProps {
  label: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  /** Latest selectable day (inclusive). */
  max?: ISODate;
  /** Earliest selectable day (inclusive). */
  min?: ISODate;
  error?: string;
  hint?: string;
  placeholder?: string;
}

/**
 * Date input styled like the rest of the app: a field that opens a month calendar with
 * month/year jumps, today shortcut and disabled out-of-range days. Renders in the top layer
 * (popover), so it also works inside dialogs.
 */
export function DateField({
  label,
  value,
  onChange,
  max,
  min = '1940-01-01',
  error,
  hint,
  placeholder = 'Select a date',
}: DateFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const initial = parse(value || (max && max < todayISO() ? max : todayISO()));
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  /** Which grid the calendar shows: days of a month, the 12 months, or a page of 12 years. */
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');

  const today = todayISO();
  const maxY = max ? parse(max).y : parse(today).y + 5;
  const minY = parse(min).y;

  const inRange = (iso: ISODate) => (!max || iso <= max) && (!min || iso >= min);

  function openPanel() {
    const v = parse(value || (max && max < today ? max : today));
    setView({ y: v.y, m: v.m });
    setMode('days');
    const r = triggerRef.current!.getBoundingClientRect();
    const width = 300;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    const below = r.bottom + 6;
    const PANEL_HEIGHT = 400;
    const top =
      below + PANEL_HEIGHT > window.innerHeight ? Math.max(8, r.top - PANEL_HEIGHT - 6) : below;
    setPos({ top, left });
    setOpen(true);
  }

  // The panel is a popover: shown in the top layer; clicking outside or Escape closes it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel?.showPopover) return;
    if (open && !panel.matches(':popover-open')) panel.showPopover();
    if (!open && panel.matches(':popover-open')) panel.hidePopover();
  }, [open]);

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      if (mode === 'years') return { y: y + delta * 12, m };
      if (mode === 'months') return { y: y + delta, m };
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });

  // Year pages hold 12 years and are aligned so the page containing the viewed year shows.
  const yearPageStart = view.y - (((view.y % 12) + 12) % 12);
  const yearPage = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
  const yearSelectable = (y: number) => y >= minY && y <= maxY;
  const monthSelectable = (m: number) => {
    const first = toISO(view.y, m, 1);
    const last = toISO(view.y, m, new Date(view.y, m + 1, 0).getDate());
    return (!max || first <= max) && (!min || last >= min);
  };

  const headerLabel =
    mode === 'days'
      ? `${MONTHS[view.m]} ${view.y}`
      : mode === 'months'
        ? String(view.y)
        : `${yearPage[0]} – ${yearPage[11]}`;
  const unit = mode === 'days' ? 'month' : mode === 'months' ? 'year' : '12 years';

  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pick = (iso: ISODate) => {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={error || hint ? messageId : undefined}
        className={`flex w-full items-center justify-between rounded-md border bg-surface px-3 py-2 text-left text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
          error
            ? 'border-danger'
            : open
              ? 'border-primary ring-4 ring-primary/10'
              : 'border-border hover:border-primary/40'
        }`}
      >
        <span className={value ? '' : 'text-muted'}>{value ? display(value) : placeholder}</span>
        <CalendarIcon className="h-[18px] w-[18px] text-muted" />
      </button>
      {(error ?? hint) && (
        <p id={messageId} className={`text-xs ${error ? 'text-danger' : 'text-muted'}`}>
          {error ?? hint}
        </p>
      )}

      <div
        ref={panelRef}
        popover="auto"
        role="dialog"
        aria-label={`Choose ${label.toLowerCase()}`}
        onToggle={(e) => setOpen((e as unknown as { newState: string }).newState === 'open')}
        style={{ top: pos.top, left: pos.left }}
        className="fixed m-0 w-[300px] animate-pop-in rounded-2xl border border-border bg-surface p-4 text-foreground shadow-2xl [&:not(:popover-open)]:hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={`Previous ${unit}`}
            className="rounded-full p-1.5 text-muted hover:bg-background hover:text-foreground"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() =>
              setMode(mode === 'days' ? 'years' : mode === 'months' ? 'years' : 'days')
            }
            aria-label={mode === 'years' ? 'Back to days' : 'Choose month and year'}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold hover:bg-background"
          >
            {headerLabel}
            <ChevronRightIcon
              className={`h-3.5 w-3.5 text-muted transition-transform ${mode === 'days' ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={`Next ${unit}`}
            className="rounded-full p-1.5 text-muted hover:bg-background hover:text-foreground"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {mode === 'years' && (
          <div className="mt-3 grid animate-fade-in grid-cols-3 gap-2">
            {yearPage.map((y) => {
              const selected = value ? parse(value).y === y : false;
              return (
                <button
                  key={y}
                  type="button"
                  disabled={!yearSelectable(y)}
                  onClick={() => {
                    setView((v) => ({ ...v, y }));
                    setMode('months');
                  }}
                  className={`h-12 rounded-xl text-sm tabular-nums ${
                    selected
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : y === view.y
                        ? 'font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/10'
                        : 'hover:bg-background disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'months' && (
          <div className="mt-3 grid animate-fade-in grid-cols-3 gap-2">
            {MONTHS.map((name, m) => {
              const selected = value ? parse(value).y === view.y && parse(value).m === m : false;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={!monthSelectable(m)}
                  onClick={() => {
                    setView((v) => ({ ...v, m }));
                    setMode('days');
                  }}
                  className={`h-12 rounded-xl text-sm ${
                    selected
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'hover:bg-background disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'days' && (
          <div className="mt-3 grid animate-fade-in grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1 text-xs font-medium text-muted">
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const iso = toISO(view.y, view.m, day);
              const selected = iso === value;
              const isToday = iso === today;
              const disabled = !inRange(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(iso)}
                  aria-label={display(iso)}
                  aria-pressed={selected}
                  className={`h-9 rounded-full text-sm tabular-nums transition-colors ${
                    selected
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : disabled
                        ? 'cursor-not-allowed text-muted/40'
                        : isToday
                          ? 'font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/10'
                          : 'hover:bg-background'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-3 py-1.5 text-muted hover:bg-background hover:text-foreground"
          >
            Cancel
          </button>
          {inRange(today) && (
            <button
              type="button"
              onClick={() => pick(today)}
              className="rounded-full px-3 py-1.5 font-medium text-primary hover:bg-primary/10"
            >
              Today
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
