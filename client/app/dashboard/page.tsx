'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { allowedModules } from '@/lib/modules';

/** Module picker for users with access to more than one module (e.g. Admin). */
export default function DashboardHomePage() {
  const { user, can } = useAuth();
  const modules = allowedModules(can);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Welcome, {user?.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted">Choose a module to work in.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {modules.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block h-full rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <h2 className="font-semibold">{item.label}</h2>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
