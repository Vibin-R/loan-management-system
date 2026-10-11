import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';
import { LogInIcon } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Then check your eligibility and apply in a few minutes."
      switchTo={{ label: 'Sign in', href: '/login', icon: <LogInIcon className="h-4 w-4" /> }}
    >
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
