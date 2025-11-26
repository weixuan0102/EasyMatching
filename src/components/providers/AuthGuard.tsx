'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress } from '@mui/material';

type AuthGuardProps = {
  children: ReactNode;
};

const PUBLIC_PATHS = ['/onboarding', '/auth/login', '/auth/register'];
const AUTH_PAGES = ['/auth/login', '/auth/register'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const normalizedPath = useMemo(() => {
    if (!pathname) {
      return '';
    }
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }, [pathname]);
  const isPublicPath = useMemo(
    () => PUBLIC_PATHS.includes(normalizedPath),
    [normalizedPath]
  );
  const isAuthPage = useMemo(
    () => AUTH_PAGES.includes(normalizedPath),
    [normalizedPath]
  );

  useEffect(() => {
    if (status === 'unauthenticated' && !isPublicPath) {
      let target = normalizedPath;
      if (typeof window !== 'undefined') {
        const { pathname: currentPath, search } = window.location;
        target = `${currentPath}${search}`;
      }
      const shouldAttachCallback =
        target && target.length > 0 && target !== '/chat' && !isAuthPage;
      const redirectUrl = shouldAttachCallback
        ? `/auth/login?callbackUrl=${encodeURIComponent(target)}`
        : '/auth/login';
      router.replace(redirectUrl);
    }
  }, [status, isPublicPath, normalizedPath, router, isAuthPage]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    if (!session.user.onboardingCompleted && normalizedPath !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (
      session.user.onboardingCompleted &&
      (normalizedPath === '/onboarding' || isAuthPage)
    ) {
      router.replace('/chat');
    }
  }, [status, session?.user, normalizedPath, router, isAuthPage]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (status !== 'authenticated') {
    return null;
  }

  if (!session.user.onboardingCompleted && normalizedPath !== '/onboarding') {
    return null;
  }

  return <>{children}</>;
}

