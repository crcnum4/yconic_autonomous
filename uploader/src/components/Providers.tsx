'use client';

import { SessionProvider } from 'next-auth/react';
import { NavBar } from '@/components/NavBar';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="relative z-50">
          <NavBar />
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
};
