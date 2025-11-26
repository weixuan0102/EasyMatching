import { ReactNode } from 'react';

import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/providers/AuthGuard';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

