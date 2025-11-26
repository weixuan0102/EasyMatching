'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';

type LoginViewProps = {
  callbackUrl?: string;
};

type SavedAccount = {
  loginId: string;
  name?: string | null;
  image?: string | null;
};

const STORAGE_KEY = 'easymatching:savedLogins';
const DEFAULT_CALLBACK = '/chat';

const mapErrorCodeToMessage = (code: string | null) => {
  switch (code) {
    case 'CredentialsSignin':
      return 'userID 不正確，請確認後再試。';
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
      return '第三方登入失敗，請重新嘗試。';
    default:
      return null;
  }
};

const loadSavedAccounts = (): SavedAccount[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedAccount[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item?.loginId === 'string');
  } catch {
    return [];
  }
};

export default function LoginView({ callbackUrl }: LoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    setSavedAccounts(loadSavedAccounts());
  }, []);

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

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = loginId.trim();
      if (trimmed.length === 0) {
        setError('請輸入 userID');
        return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await signIn('user-id', {
          loginId: trimmed,
          callbackUrl: normalizedCallback,
          redirect: false
        });

        if (result?.error) {
          setError(mapErrorCodeToMessage(result.error) ?? '登入失敗，請再試一次。');
          setIsSubmitting(false);
          return;
        }

        if (result?.url) {
          router.replace(result.url);
        }
      } catch {
        setError('登入失敗，請稍後再試。');
        setIsSubmitting(false);
      }
    },
    [loginId, normalizedCallback, router]
  );

  const handleQuickLogin = useCallback(
    async (loginIdValue: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await signIn('user-id', {
          loginId: loginIdValue,
          callbackUrl: normalizedCallback,
          redirect: false
        });

        if (result?.error) {
          setError(mapErrorCodeToMessage(result.error) ?? '登入失敗，請再試一次。');
          setIsSubmitting(false);
          return;
        }

        if (result?.url) {
          router.replace(result.url);
        }
      } catch {
        setError('登入失敗，請稍後再試。');
        setIsSubmitting(false);
      }
    },
    [normalizedCallback, router]
  );

  const handleRemoveAccount = useCallback(
    (loginIdValue: string) => {
      if (typeof window === 'undefined') {
        return;
      }
      const remaining = savedAccounts.filter((item) => item.loginId !== loginIdValue);
      setSavedAccounts(remaining);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    },
    [savedAccounts]
  );

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
              輸入您的 userID，或選擇曾經登入過的帳號。
            </Typography>
          </Stack>

          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="輸入 userID"
              variant="outlined"
              InputProps={{
                sx: {
                  bgcolor: 'rgba(15,23,42,0.6)',
                  color: 'rgba(248,250,252,0.94)',
                  borderRadius: 3
                }
              }}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<LoginIcon />}
              disabled={isSubmitting}
              sx={{
                bgcolor: 'rgba(148,163,184,0.28)',
                borderRadius: 3,
                py: 1.2,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(148,163,184,0.4)'
                }
              }}
            >
              登入
            </Button>
          </Stack>

          <Divider
            light
            sx={{
              borderColor: 'rgba(148,163,184,0.25)',
              '&::before, &::after': {
                borderColor: 'rgba(148,163,184,0.25)'
              }
            }}
          >
            <Typography variant="caption" color="rgba(148,163,184,0.8)">
              曾登入的 userID
            </Typography>
          </Divider>

          <Stack spacing={1}>
            {savedAccounts.length === 0 && (
              <Typography variant="body2" color="rgba(148,163,184,0.65)">
                尚無歷史帳號紀錄。登入成功後會儲存在本機。
              </Typography>
            )}
            {savedAccounts.map((account) => (
              <Stack
                key={account.loginId}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: 'rgba(96,165,250,0.12)',
                  border: '1px solid rgba(96,165,250,0.25)'
                }}
              >
                <Avatar
                  src={account.image ?? undefined}
                  alt={account.name ?? account.loginId}
                  sx={{ width: 40, height: 40 }}
                >
                  {account.loginId[0]?.toUpperCase() ?? 'U'}
                </Avatar>
                <Stack spacing={0.25} flexGrow={1}>
                  <Typography fontWeight={600}>{account.loginId}</Typography>
                  {account.name && (
                    <Typography variant="body2" color="rgba(148,163,184,0.85)">
                      {account.name}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={isSubmitting}
                    onClick={() => handleQuickLogin(account.loginId)}
                  >
                    登入
                  </Button>
                  <IconButton
                    color="inherit"
                    onClick={() => handleRemoveAccount(account.loginId)}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Stack spacing={1.5} alignItems="center">
            <Typography variant="body2" color="rgba(148,163,184,0.8)">
              還沒有帳號？
            </Typography>
            <Button
              component={Link}
              href="/auth/register"
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: 'rgba(96,165,250,0.4)',
                color: 'rgba(226,232,240,0.96)',
                '&:hover': {
                  borderColor: 'rgba(96,165,250,0.8)',
                  bgcolor: 'rgba(96,165,250,0.12)'
                }
              }}
            >
              註冊新帳號
            </Button>
          </Stack>
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
