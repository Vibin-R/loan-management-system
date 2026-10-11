'use client';

import { useId } from 'react';
import { BRE_RULES, EMPLOYMENT_OPTIONS } from '@/lib/bre';
import { formatDate, formatDateTime, formatINRWhole } from '@/lib/format';
import type { Lead, LeadStage } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronRightIcon, ClockIcon } from '@/components/ui/icons';

export const STAGE_BADGE: Record<LeadStage, { label: string; dot: string; tint: string }> = {
  REGISTERED: { label: 'Signed up', dot: 'bg-muted', tint: 'bg-background text-foreground' },
  BRE_FAILED: { label: 'Not eligible', dot: 'bg-danger', tint: 'bg-danger/10 text-danger' },
  ELIGIBLE: {
    label: 'Eligible, not applied',
    dot: 'bg-success',
    tint: 'bg-success/10 text-success',
  },
};

const employmentLabel = (mode: string) =>
  EMPLOYMENT_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

type Profile = NonNullable<Lead['profile']>;

/** Why a lead failed, written for the sales team (the borrower sees their own wording). */
function failureReason(rule: Profile['breFailures'][number], p: Profile): string {
  switch (rule) {
    case 'AGE':
      return `Age ${p.ageAtCheck}: outside the ${BRE_RULES.minAge}–${BRE_RULES.maxAge} range`;
    case 'SALARY':
      return `Salary ${formatINRWhole(p.monthlySalary)}/month: below the ${formatINRWhole(BRE_RULES.minMonthlySalary)} minimum`;
    case 'PAN':
      return `PAN "${p.pan}": not a valid format (5 letters, 4 digits, 1 letter)`;
    case 'EMPLOYMENT':
      return 'Employment: unemployed';
  }
}

/** Next step the sales rep can take with this lead. */
const NEXT_STEP: Record<LeadStage, string> = {
  REGISTERED: 'Signed up but has not entered any details. Follow up to help them start.',
  BRE_FAILED:
    'Failed the eligibility check. If a detail was mistyped, they can correct it and re-check.',
  ELIGIBLE: 'Eligible but has not applied yet. A good lead to follow up on.',
};

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`truncate text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

interface LeadRowProps {
  lead: Lead;
  open: boolean;
  onToggle: () => void;
}

/** One lead: basics in the row; click to expand the full profile and eligibility result. */
export function LeadRow({ lead, open, onToggle }: LeadRowProps) {
  const panelId = useId();
  const badge = STAGE_BADGE[lead.stage];
  const p = lead.profile;

  return (
    <article>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3.5 rounded-xl py-4 text-left hover:bg-background/60 sm:gap-5 sm:px-2"
      >
        <Avatar name={lead.name} tone={badge.tint} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{lead.name}</span>
          <span className="block truncate text-xs text-muted">{lead.email}</span>
        </span>
        <span className="hidden items-center gap-2 whitespace-nowrap text-sm sm:inline-flex sm:w-44">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
        <span className="hidden items-center gap-1.5 whitespace-nowrap text-sm text-muted md:inline-flex md:w-28">
          <ClockIcon className="h-4 w-4" />
          {formatDate(lead.signedUpAt)}
        </span>
        <ChevronRightIcon
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Smooth height animation: grid row goes 0fr → 1fr. */}
      <div
        id={panelId}
        role="region"
        aria-label={`${lead.name} details`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mb-4 space-y-4 rounded-2xl bg-background/70 p-4 sm:ml-[3.375rem] sm:p-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:hidden">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
              <span className="text-muted">Signed up {formatDate(lead.signedUpAt)}</span>
            </div>

            {p ? (
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Detail label="Name on PAN" value={p.fullName} />
                <Detail label="PAN" value={p.pan} mono />
                <Detail
                  label="Date of birth"
                  value={`${formatDate(p.dob)} (age ${p.ageAtCheck})`}
                />
                <Detail label="Monthly salary" value={formatINRWhole(p.monthlySalary)} />
                <Detail label="Employment" value={employmentLabel(p.employmentMode)} />
                <Detail label="Eligibility checked" value={formatDateTime(p.checkedAt)} />
              </dl>
            ) : (
              <p className="text-sm text-muted">No personal details entered yet.</p>
            )}

            {p && p.breFailures.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-danger">
                  Failed eligibility rules
                </p>
                <ul className="space-y-1 text-sm">
                  {p.breFailures.map((rule) => (
                    <li key={rule} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger"
                      />
                      {failureReason(rule, p)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="border-t border-border pt-3 text-xs text-muted">
              {NEXT_STEP[lead.stage]}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
