'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

type LoginViewProps = {
  callbackUrl?: string;
};

const DEFAULT_CALLBACK = '/chat';

const mapErrorCodeToMessage = (code: string | null) => {
  switch (code) {
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
      return '第三方登入失敗，請重新嘗試。';
    default:
      return null;
  }
};

export default function LoginView({ callbackUrl }: LoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCallback = useMemo(
    () => (callbackUrl && callbackUrl.length > 0 ? callbackUrl : DEFAULT_CALLBACK),
    [callbackUrl]
  );

  useEffect(() => {
    const errorCode = searchParams?.get('error') ?? null;
    const message = mapErrorCodeToMessage(errorCode);
    if (message) {
      setTimeout(() => {
        setError(message);
      }, 0);
      const params = new URLSearchParams(searchParams?.toString());
      params.delete('error');
      router.replace(
        params.toString().length > 0 ? `/auth/login?${params.toString()}` : '/auth/login',
        { scroll: false }
      );
    }
  }, [router, searchParams]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn('google', {
        callbackUrl: normalizedCallback
      });
    } catch {
      setError('Google 登入失敗，請稍後再試。');
      setIsSubmitting(false);
    }
  }, [normalizedCallback]);


  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(15,23,42,0.92)',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(99,102,241,0.3), transparent 55%), radial-gradient(circle at bottom right, rgba(56,189,248,0.25), transparent 50%)',
        px: 2,
        py: 6
      }}
    >
      <Card
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: 'rgba(15,23,42,0.88)',
          borderRadius: 4,
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(148,163,184,0.18)',
          color: 'rgba(226,232,240,0.96)'
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              登入 EasyMatching
            </Typography>
            <Typography variant="body2" color="rgba(148,163,184,0.9)">
              請使用 Google 帳號登入
            </Typography>
          </Stack>

          <Button
            onClick={handleGoogleSignIn}
            variant="contained"
            disableElevation
            startIcon={<GoogleIcon />}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#ffffff',
              color: '#1f2937',
              borderRadius: 3,
              py: 1.2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f3f4f6'
              }
            }}
          >
            使用 Google 登入
          </Button>

        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(error)}
        onClose={() => setError(null)}
        autoHideDuration={4000}
      >
        <Alert
          onClose={() => setError(null)}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
