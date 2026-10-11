'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { allowedModules } from '@/lib/modules';

/** Lists only the modules the user holds permissions for. Admin holds all four. */
export function DashboardNav() {
  const { can } = useAuth();
  const pathname = usePathname();
  const modules = allowedModules(can);

  return (
    <nav aria-label="Modules" className="flex gap-1 overflow-x-auto md:flex-col">
      {modules.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
