'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { apiClient } from '@/lib/api';

type HobbyItem = {
  id: string;
  name: string;
  slug: string;
  selected: boolean;
};

type OnboardingFormProps = {
  profile: {
    loginId: string | null;
  };
  hobbies: HobbyItem[];
};

const MIN_SELECTION = 1;
const loginIdPattern = /^[a-zA-Z0-9_]+$/;

export default function OnboardingForm({ profile, hobbies }: OnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [loginId, setLoginId] = useState(profile.loginId ?? '');
  const [loginIdError, setLoginIdError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(hobbies.filter((hobby) => hobby.selected).map((hobby) => hobby.slug))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPrefilledLoginId = Boolean(profile.loginId);

  const toggleSelection = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const hasMinimumSelected = useMemo(
    () => selected.size >= MIN_SELECTION,
    [selected]
  );

  const handleSubmit = useCallback(async () => {
    if (!hasMinimumSelected || isSubmitting) {
      return;
    }

    const trimmedLoginId = loginId.trim();
    if (trimmedLoginId.length < 4 || trimmedLoginId.length > 24) {
      setLoginIdError('userID 長度需介於 4-24 個字元');
      return;
    }

    if (!loginIdPattern.test(trimmedLoginId)) {
      setLoginIdError('userID 僅能包含英數字與底線');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLoginIdError(null);

    try {
      await apiClient.put('/api/user', {
        loginId: trimmedLoginId
      });

      await apiClient.put('/api/user/hobbies', {
        hobbies: Array.from(selected),
        completeOnboarding: true
      });

      await update({
        user: {
          loginId: trimmedLoginId.toLowerCase(),
          onboardingCompleted: true
        }
      });

      router.replace('/chat');
    } catch {
      setError('更新失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [hasMinimumSelected, isSubmitting, loginId, router, selected, update]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 6
      }}
    >
      <Card sx={{ maxWidth: 720, width: '100%' }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={600}>
                歡迎加入 EasyMatching
              </Typography>
              <Typography color="text.secondary">
              為自己設定 userID，並選擇至少 {MIN_SELECTION} 個興趣標籤，讓我們推薦更合適的聊天夥伴。
              </Typography>
            </Stack>

          <Stack spacing={1.5}>
            <TextField
              label="userID"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="例如 easyuser_01"
              helperText={
                loginIdError ??
                (isPrefilledLoginId
                  ? '你已在註冊頁設定 userID，如需修改請返回註冊流程。'
                  : '4-24 個字，僅限英數字與底線，將自動轉為小寫')
              }
              error={Boolean(loginIdError)}
              disabled={isPrefilledLoginId}
              inputProps={{ maxLength: 24 }}
              required
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2
            }}
          >
            {hobbies.map((hobby) => (
              <Box key={hobby.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected.has(hobby.slug)}
                      onChange={() => toggleSelection(hobby.slug)}
                      color="primary"
                    />
                  }
                  label={<Typography fontWeight={500}>{hobby.name}</Typography>}
                />
              </Box>
            ))}
          </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                size="large"
                disabled={!hasMinimumSelected || isSubmitting}
                onClick={handleSubmit}
                endIcon={
                  isSubmitting ? <CircularProgress size={20} color="inherit" /> : null
                }
              >
                開始使用
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(error)}
        onClose={() => setError(null)}
        message={error}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

