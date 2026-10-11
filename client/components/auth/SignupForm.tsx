'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated';
import { collectErrors, validateEmail, validateName, validateNewPassword } from '@/lib/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { UserPlusIcon } from '@/components/ui/icons';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';

type Field = 'name' | 'email' | 'password';

const VALIDATORS: Record<Field, (value: string) => string | undefined> = {
  name: validateName,
  email: validateEmail,
  password: validateNewPassword,
};

export function SignupForm() {
  const { signup } = useAuth();
  useRedirectIfAuthenticated();

  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  // Validate a field when the user leaves it, so errors appear without waiting for submit.
  const validateOnBlur = (field: Field) => () => {
    if (values[field])
      setErrors((errs) => ({ ...errs, [field]: VALIDATORS[field](values[field]) }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = collectErrors({
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await signup(values.name.trim(), values.email.trim(), values.password);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      else if (err instanceof ApiError && err.code === 'EMAIL_TAKEN')
        setErrors({ email: 'An account with this email already exists. Log in instead.' });
      else setFormError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Full name"
        appearance="pill"
        autoComplete="name"
        value={values.name}
        onChange={update('name')}
        onBlur={validateOnBlur('name')}
        error={errors.name}
        autoFocus
      />
      <TextField
        label="Email"
        appearance="pill"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={update('email')}
        onBlur={validateOnBlur('email')}
        error={errors.email}
      />
      <PasswordField
        label="Password"
        appearance="pill"
        autoComplete="new-password"
        value={values.password}
        onChange={update('password')}
        onBlur={validateOnBlur('password')}
        error={errors.password}
        hint="At least 8 characters, with a letter and a number"
      />
      <Button type="submit" shape="pill" loading={submitting} fullWidth className="!mt-6">
        {!submitting && <UserPlusIcon className="h-[18px] w-[18px]" />}
        Create account
      </Button>
    </form>
  );
}
