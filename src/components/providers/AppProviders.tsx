'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

import ThemeRegistry from '@/components/providers/ThemeRegistry';
import SessionTracker from '@/components/providers/SessionTracker';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ThemeRegistry>
        <SessionTracker />
        {children}
      </ThemeRegistry>
    </SessionProvider>
  );
}

