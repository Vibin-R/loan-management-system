'use client';

import { useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useSubmitError } from '@/lib/formErrors';
import { useToast } from '@/lib/toast';
import { BRE_RULES, EMPLOYMENT_OPTIONS, eligibilityHints } from '@/lib/bre';
import { borrowerApi } from '@/lib/borrowerApi';
import type { BorrowerProfile, BreFailure, EmploymentMode } from '@/lib/types';
import { collectErrors } from '@/lib/validation';
import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';
import { StepNav } from './StepNav';

type Field = 'fullName' | 'pan' | 'dob' | 'monthlySalary' | 'employmentMode';
const FIELDS: readonly Field[] = ['fullName', 'pan', 'dob', 'monthlySalary', 'employmentMode'];
type Values = Record<Exclude<Field, 'employmentMode'>, string> & {
  employmentMode: EmploymentMode | '';
};

interface DetailsStepProps {
  profile: BorrowerProfile | null;
  onEligible: (profile: BorrowerProfile) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function initialValues(profile: BorrowerProfile | null): Values {
  return {
    fullName: profile?.fullName ?? '',
    pan: profile?.pan ?? '',
    dob: profile?.dob ?? '',
    monthlySalary: profile ? String(profile.monthlySalary) : '',
    employmentMode: profile?.employmentMode ?? '',
  };
}

function validate(values: Values): Partial<Record<Field, string>> {
  return collectErrors({
    fullName: values.fullName.trim().length < 2 ? 'Enter your full name' : undefined,
    pan: values.pan ? undefined : 'Enter your PAN',
    dob: !values.dob
      ? 'Enter your date of birth'
      : values.dob > todayISO()
        ? 'Date of birth cannot be in the future'
        : undefined,
    monthlySalary:
      !values.monthlySalary || Number(values.monthlySalary) <= 0
        ? 'Enter your monthly salary'
        : undefined,
    employmentMode: !values.employmentMode ? 'Choose your employment type' : undefined,
  });
}

/** Step 2: personal details. Submitting runs the eligibility check (BRE) on the server. */
/** The input each eligibility rule is about, so a failure shows under that input. */
const FIELD_FOR_RULE: Record<BreFailure['rule'], Field> = {
  AGE: 'dob',
  SALARY: 'monthlySalary',
  PAN: 'pan',
  EMPLOYMENT: 'employmentMode',
};

const failuresToErrors = (failures: BreFailure[]): Partial<Record<Field, string>> =>
  Object.fromEntries(failures.map((f) => [FIELD_FOR_RULE[f.rule], f.message]));

export function DetailsStep({ profile, onEligible }: DetailsStepProps) {
  const [values, setValues] = useState<Values>(() => initialValues(profile));
  // A returning borrower who failed last time sees why, under the inputs to fix.
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>(() =>
    profile && !profile.bre.passed ? failuresToErrors(profile.bre.failures) : {},
  );
  const toast = useToast();
  const showSubmitError = useSubmitError();
  const [submitting, setSubmitting] = useState(false);

  // Instant hints from the client copy of the rules; the server decides on submit.
  const hints = useMemo(() => eligibilityHints(values), [values]);

  const update = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const { profile: saved } = await borrowerApi.saveProfile({
        fullName: values.fullName.trim(),
        pan: values.pan,
        dob: values.dob,
        monthlySalary: Number(values.monthlySalary),
        employmentMode: values.employmentMode as EmploymentMode,
      });
      onEligible(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BRE_REJECTED') {
        // Not eligible: a toast lists every failed rule, and each shows under its input.
        const failures = err.details as BreFailure[];
        setErrors(failuresToErrors(failures));
        toast(
          ["You're not eligible for a loan yet", ...failures.map((f) => `• ${f.message}`)].join(
            '\n',
          ),
          'error',
        );
      } else {
        showSubmitError(err, {
          fields: FIELDS,
          setErrors,
          fallback: 'Could not save your details.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField
        label="Full name (as on PAN)"
        autoComplete="name"
        value={values.fullName}
        onChange={(e) => update('fullName', e.target.value)}
        error={errors.fullName}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="PAN"
          value={values.pan}
          maxLength={10}
          autoCapitalize="characters"
          placeholder="ABCDE1234F"
          className="font-mono uppercase tracking-wider"
          onChange={(e) => update('pan', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          error={errors.pan}
          hint={hints.pan}
        />
        <DateField
          label="Date of birth"
          max={todayISO()}
          value={values.dob}
          onChange={(dob) => update('dob', dob)}
          error={errors.dob}
          hint={hints.dob}
          placeholder="Select your date of birth"
        />
      </div>

      <TextField
        label="Monthly salary (₹)"
        type="number"
        inputMode="numeric"
        min={0}
        step="any"
        placeholder={`At least ${BRE_RULES.minMonthlySalary.toLocaleString('en-IN')}`}
        value={values.monthlySalary}
        onChange={(e) => update('monthlySalary', e.target.value)}
        error={errors.monthlySalary}
        hint={hints.monthlySalary}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Employment</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {EMPLOYMENT_OPTIONS.map((option) => {
            const selected = values.employmentMode === option.value;
            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="employmentMode"
                  value={option.value}
                  checked={selected}
                  onChange={() => update('employmentMode', option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted">{option.hint}</span>
              </label>
            );
          })}
        </div>
        {(errors.employmentMode ?? hints.employmentMode) && (
          <p className={`text-xs ${errors.employmentMode ? 'text-danger' : 'text-muted'}`}>
            {errors.employmentMode ?? hints.employmentMode}
          </p>
        )}
      </fieldset>

      <StepNav nextLabel="Check eligibility & continue" busy={submitting} />
    </form>
  );
}
