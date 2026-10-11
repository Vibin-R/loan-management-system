import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { UserPlusIcon } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up your application or your work queue."
      switchTo={{ label: 'Sign up', href: '/signup', icon: <UserPlusIcon className="h-4 w-4" /> }}
    >
      {/* LoginForm reads ?next= from the URL, which needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
