'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSubmitError } from '@/lib/formErrors';
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated';
import { collectErrors, validateEmail, validateRequired } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { LogInIcon } from '@/components/ui/icons';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { DemoAccounts } from './DemoAccounts';

type Field = 'email' | 'password';
const FIELDS: readonly Field[] = ['email', 'password'];

export function LoginForm() {
  const { login } = useAuth();
  useRedirectIfAuthenticated();

  const [values, setValues] = useState<Record<Field, string>>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const showSubmitError = useSubmitError();

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      // Wrong credentials show under the password; a server problem shows as a toast.
      showSubmitError(err, {
        fields: FIELDS,
        setErrors,
        fallback: 'Login failed. Please try again.',
      });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 short:space-y-3">
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
      <Button
        type="submit"
        shape="pill"
        loading={submitting}
        fullWidth
        className="!mt-6 short:!mt-4"
      >
        {!submitting && <LogInIcon className="h-[18px] w-[18px]" />}
        Sign in
      </Button>
      <DemoAccounts
        onSelect={(email, password) => {
          setValues({ email, password });
          setErrors({});
        }}
      />
    </form>
  );
}
