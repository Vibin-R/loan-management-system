import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LMS · Loan Management System', template: '%s · LMS' },
  description: 'Apply for a personal loan and track it through approval, disbursal and repayment.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
