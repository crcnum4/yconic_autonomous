'use client';

import { SessionProvider } from 'next-auth/react';
import { NavBar } from '@/components/NavBar';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main>{children}</main>
      </div>
    </SessionProvider>
  );
};
