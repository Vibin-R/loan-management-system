import { DEMO_ACCOUNTS } from '@/lib/demoAccounts';

interface DemoAccountsProps {
  onSelect: (email: string, password: string) => void;
}

/** One-click fill for the seeded accounts, so each role can be tried quickly. */
export function DemoAccounts({ onSelect }: DemoAccountsProps) {
  return (
    <details className="group rounded-2xl border border-dashed border-border px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none text-muted marker:text-muted group-open:mb-3">
        Try a demo account
      </summary>
      <ul className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              onClick={() => onSelect(account.email, account.password)}
              className="w-full rounded-xl border border-border px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="block font-medium">{account.role}</span>
              <span className="block truncate text-xs text-muted">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
