'use client';

import { useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { BRE_RULES, EMPLOYMENT_OPTIONS, eligibilityHints } from '@/lib/bre';
import { borrowerApi } from '@/lib/borrowerApi';
import type { BorrowerProfile, BreFailure, EmploymentMode } from '@/lib/types';
import { collectErrors } from '@/lib/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { BreRejection } from './BreRejection';

type Field = 'fullName' | 'pan' | 'dob' | 'monthlySalary' | 'employmentMode';
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
    pan: values.pan.length !== 10 ? 'PAN must be 10 characters' : undefined,
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
export function DetailsStep({ profile, onEligible }: DetailsStepProps) {
  const [values, setValues] = useState<Values>(() => initialValues(profile));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failures, setFailures] = useState<BreFailure[]>(
    profile && !profile.bre.passed ? profile.bre.failures : [],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Instant hints from the client copy of the rules; the server decides on submit.
  const hints = useMemo(() => eligibilityHints(values), [values]);

  const update = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
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
      setFailures([]);
      onEligible(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BRE_REJECTED') {
        setFailures(err.details as BreFailure[]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setErrors(err.fieldErrors);
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not save your details.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {failures.length > 0 && <BreRejection failures={failures} />}
      {formError && <Alert>{formError}</Alert>}

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
        <TextField
          label="Date of birth"
          type="date"
          max={todayISO()}
          value={values.dob}
          onChange={(e) => update('dob', e.target.value)}
          error={errors.dob}
          hint={hints.dob}
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

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={submitting}>
          Check eligibility &amp; continue
        </Button>
      </div>
    </form>
  );
}
