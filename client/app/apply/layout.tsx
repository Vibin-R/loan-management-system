import { BorrowerShell } from '@/components/layout/BorrowerShell';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <BorrowerShell>{children}</BorrowerShell>;
}
