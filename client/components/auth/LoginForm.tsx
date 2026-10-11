'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated';
import { collectErrors, validateEmail, validateRequired } from '@/lib/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { LogInIcon } from '@/components/ui/icons';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { DemoAccounts } from './DemoAccounts';

type Field = 'email' | 'password';

export function LoginForm() {
  const { login } = useAuth();
  useRedirectIfAuthenticated();

  const [values, setValues] = useState<Record<Field, string>>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = collectErrors({
      email: validateEmail(values.email),
      password: validateRequired(values.password, 'password'),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      // useRedirectIfAuthenticated navigates once the session is set.
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      else setFormError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Email"
        appearance="pill"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={update('email')}
        error={errors.email}
        autoFocus
      />
      <PasswordField
        label="Password"
        appearance="pill"
        autoComplete="current-password"
        value={values.password}
        onChange={update('password')}
        error={errors.password}
      />
      <Button type="submit" shape="pill" loading={submitting} fullWidth className="!mt-6">
        {!submitting && <LogInIcon className="h-[18px] w-[18px]" />}
        Sign in
      </Button>
      <DemoAccounts
        onSelect={(email, password) => {
          setValues({ email, password });
          setErrors({});
          setFormError(null);
        }}
      />
    </form>
  );
}
