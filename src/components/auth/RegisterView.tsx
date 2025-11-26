'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';

import { apiClient } from '@/lib/api';

type RegisterViewProps = {
  callbackUrl?: string;
  providers: {
    google: boolean;
    github: boolean;
    facebook: boolean;
  };
};

const loginIdPattern = /^[a-zA-Z0-9_]+$/;

export default function RegisterView({ callbackUrl, providers }: RegisterViewProps) {
  const [loginId, setLoginId] = useState('');
  const [loginIdError, setLoginIdError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const targetCallback = callbackUrl && callbackUrl.length > 0 ? callbackUrl : '/onboarding';

  const validateLoginIdFormat = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 4 || trimmed.length > 24) {
      setLoginIdError('userID 長度需介於 4-24 個字元');
      return null;
    }
    if (!loginIdPattern.test(trimmed)) {
      setLoginIdError('userID 僅能包含英數字與底線');
      return null;
    }
    return trimmed.toLowerCase();
  };

  const checkLoginIdAvailability = async (value: string) => {
    const response = await apiClient.post('/api/auth/login-id', { loginId: value });
    return response.data.available as boolean;
  };

  const handleProviderSignIn = async (providerId: string) => {
    if (isChecking) {
      return;
    }

    const formatted = validateLoginIdFormat(loginId);
    if (!formatted) {
      return;
    }

    setIsChecking(true);
    setError(null);
    setLoginIdError(null);

    try {
      const available = await checkLoginIdAvailability(formatted);
      if (!available) {
        setLoginIdError('userID 已被其他人使用');
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('easymatching:pendingLoginId', formatted);
      }

      await signIn(providerId, {
        callbackUrl: `${targetCallback}?loginId=${encodeURIComponent(formatted)}`
      });
    } catch {
      setError('驗證 userID 或啟動 OAuth 時發生錯誤，請稍後再試。');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(15,23,42,0.92)',
        backgroundImage:
          'radial-gradient(circle at top right, rgba(244,114,182,0.25), transparent 55%), radial-gradient(circle at bottom left, rgba(167,139,250,0.25), transparent 50%)',
        px: 2,
        py: 6
      }}
    >
      <Card
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 460,
          bgcolor: 'rgba(17,24,39,0.88)',
          borderRadius: 4,
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(148,163,184,0.18)',
          color: 'rgba(226,232,240,0.96)'
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              註冊 EasyMatching
            </Typography>
            <Typography variant="body2" color="rgba(148,163,184,0.85)">
              先設定一個 userID，接著選擇偏好的登入方式完成註冊。
            </Typography>
          </Stack>

          <TextField
            label="userID"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="例如 easyuser_01"
            helperText={loginIdError ?? '4-24 個字元，僅限英數字與底線'}
            error={Boolean(loginIdError)}
        InputProps={{
          sx: {
            bgcolor: 'rgba(15,23,42,0.6)',
            color: 'rgba(248,250,252,0.94)',
            borderRadius: 3,
            '& input::placeholder': {
              color: 'rgba(148,163,184,0.7)',
              opacity: 1
            }
          }
        }}
        InputLabelProps={{
          sx: {
            color: 'rgba(148,163,184,0.8)',
            '&.Mui-focused': {
              color: 'rgba(99,102,241,0.9)'
            }
          }
        }}
        FormHelperTextProps={{
          sx: {
            color: loginIdError ? '#f87171' : 'rgba(148,163,184,0.8)'
          }
        }}
            inputProps={{ maxLength: 24 }}
            required
            fullWidth
          />

          <Stack spacing={2}>
            {providers.google && (
              <Button
                onClick={() => handleProviderSignIn('google')}
                variant="contained"
                disableElevation
                startIcon={<GoogleIcon />}
                disabled={isChecking}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#1f2937',
                  borderRadius: 3,
                  py: 1.4,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#f3f4f6'
                  }
                }}
              >
                使用 Google 註冊
              </Button>
            )}

            {providers.github && (
              <Button
                onClick={() => handleProviderSignIn('github')}
                variant="outlined"
                startIcon={<GitHubIcon />}
                disabled={isChecking}
                sx={{
                  borderRadius: 3,
                  borderColor: 'rgba(148,163,184,0.4)',
                  color: 'rgba(226,232,240,0.96)',
                  py: 1.4,
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: 'rgba(148,163,184,0.7)',
                    bgcolor: 'rgba(148,163,184,0.12)'
                  }
                }}
              >
                使用 GitHub 註冊
              </Button>
            )}

            {providers.facebook && (
              <Button
                onClick={() => handleProviderSignIn('facebook')}
                variant="outlined"
                startIcon={<FacebookIcon />}
                disabled={isChecking}
                sx={{
                  borderRadius: 3,
                  borderColor: 'rgba(96,165,250,0.4)',
                  color: 'rgba(226,232,240,0.96)',
                  py: 1.4,
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: 'rgba(96,165,250,0.7)',
                    bgcolor: 'rgba(96,165,250,0.12)'
                  }
                }}
              >
                使用 Facebook 註冊
              </Button>
            )}

            {!providers.google && !providers.github && !providers.facebook && (
              <Alert severity="warning">
                尚未啟用任何 OAuth Provider，請於環境變數設定後重新整理。
              </Alert>
            )}
          </Stack>

          <Divider
            sx={{
              borderColor: 'rgba(148,163,184,0.25)',
              '&::before, &::after': {
                borderColor: 'rgba(148,163,184,0.25)'
              }
            }}
          >
            <Typography variant="caption" color="rgba(148,163,184,0.8)">
              已經有帳號？
            </Typography>
          </Divider>

          <Button
            component={Link}
            href="/auth/login"
            variant="text"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'rgba(226,232,240,0.96)',
              fontWeight: 600,
              borderRadius: 3,
              '&:hover': {
                bgcolor: 'rgba(148,163,184,0.16)'
              }
            }}
          >
            返回登入
          </Button>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setError(null)}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
