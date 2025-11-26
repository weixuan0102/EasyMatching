'use client';

import { ReactNode } from 'react';
import { Box } from '@mui/material';

import MobileNav from '@/components/navigation/MobileNav';
import Sidebar from '@/components/navigation/Sidebar';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden'
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          padding: { xs: 2, md: 4 },
          boxSizing: 'border-box',
          height: '100%',
        }}
      >
        <MobileNav />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

