import { BorrowerShell } from '@/components/layout/BorrowerShell';

export default function MyLoansLayout({ children }: { children: React.ReactNode }) {
  return <BorrowerShell>{children}</BorrowerShell>;
}
