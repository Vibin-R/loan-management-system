'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogOutIcon } from '@/components/ui/icons';
import { Avatar } from '@/components/ui/Avatar';

export interface NavItem {
  href: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  exact?: boolean;
}

interface AppSidebarProps {
  homeHref: string;
  items: NavItem[];
}

/**
 * App navigation shared by the borrower portal and the staff dashboard: brand, nav items and
 * the signed-in user with Log out at the bottom. Becomes a top bar with scrollable tabs on phones.
 */
export function AppSidebar({ homeHref, items }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-border md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-5 py-4 md:px-7 md:pb-10 md:pt-8">
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-xs font-bold text-white"
          >
            L
          </span>
          LMS
        </Link>
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="rounded-full p-2 text-muted transition-colors hover:bg-background hover:text-foreground md:hidden"
        >
          <LogOutIcon />
        </button>
      </div>

      <nav
        aria-label="Main"
        className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4 md:pb-0"
      >
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-background font-medium text-foreground'
                  : 'text-muted hover:bg-background/60 hover:text-foreground'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-primary' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="mt-auto hidden space-y-2 px-4 pb-6 pt-8 md:block">
          <div className="flex items-center gap-3 rounded-2xl bg-background p-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted">
                {user.roles.map((r) => r.toLowerCase()).join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <LogOutIcon className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
