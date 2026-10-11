import type { Metadata } from 'next';
import { ApplicationWizard } from '@/components/application/ApplicationWizard';

export const metadata: Metadata = { title: 'Your application' };

export default function ApplyPage() {
  return <ApplicationWizard />;
}
