'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { useSession } from 'next-auth/react';

import { apiClient } from '@/lib/api';

type HobbyItem = {
  id: string;
  name: string;
  slug: string;
  selected: boolean;
};

type ProfileData = {
  username: string;
  loginId: string | null;
  bio: string;
  image: string | null;
};

type ProfileFormProps = {
  profile: ProfileData;
  hobbies: HobbyItem[];
};

export default function ProfileForm({ profile, hobbies }: ProfileFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const [formState, setFormState] = useState(() => ({
    username: profile.username,
    bio: profile.bio ?? '',
    image: profile.image ?? '',
    loginId: profile.loginId ?? null
  }));
  const [originalState, setOriginalState] = useState(formState);
  const [selectedHobbies, setSelectedHobbies] = useState<Set<string>>(
    () =>
      new Set(hobbies.filter((hobby) => hobby.selected).map((hobby) => hobby.slug))
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingHobbies, setIsSavingHobbies] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const next = {
      username: profile.username,
      bio: profile.bio ?? '',
      image: profile.image ?? '',
      loginId: profile.loginId ?? null
    };
    setFormState(next);
    setOriginalState(next);
  }, [profile.username, profile.bio, profile.image, profile.loginId]);

  useEffect(() => {
    setSelectedHobbies(
      new Set(hobbies.filter((hobby) => hobby.selected).map((hobby) => hobby.slug))
    );
  }, [hobbies]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSavingProfile(true);
    try {
      const response = await apiClient.put('/api/user', {
        username: formState.username,
        bio: formState.bio,
        image: formState.image
      });

      setSnackbar({ message: '個人資料已更新', type: 'success' });

      await update({
        user: {
          username: response.data.username,
          loginId: response.data.loginId ?? null,
          onboardingCompleted: response.data.onboardingCompleted,
          image: response.data.image ?? undefined
        }
      });

      const next = {
        username: response.data.username,
        bio: response.data.bio ?? '',
        image: response.data.image ?? '',
        loginId: response.data.loginId ?? null
      };
      setFormState(next);
      setOriginalState(next);
      router.refresh();
    } catch {
      setSnackbar({ message: '更新個人資料失敗', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleHobby = (slug: string) => {
    setSelectedHobbies((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleHobbySubmit = async () => {
    if (isSavingHobbies) {
      return;
    }

    setIsSavingHobbies(true);

    try {
      await apiClient.put('/api/user/hobbies', {
        hobbies: Array.from(selectedHobbies)
      });

      setSnackbar({ message: '興趣標籤已更新', type: 'success' });
    } catch {
      setSnackbar({ message: '更新興趣標籤失敗', type: 'error' });
    } finally {
      setIsSavingHobbies(false);
    }
  };

  const avatarInitial = useMemo(
    () => (formState.username.length > 0 ? formState.username[0].toUpperCase() : 'U'),
    [formState.username]
  );

  return (
    <Stack spacing={4}>
      <Card component="section">
        <CardHeader
          title="基本資料"
          subheader={`userID：${formState.loginId ?? '尚未設定'}`}
        />
        <CardContent>
          <Stack
            component="form"
            onSubmit={handleProfileSubmit}
            spacing={3}
            sx={{ maxWidth: 520 }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar src={formState.image || undefined} sx={{ width: 72, height: 72 }}>
                {avatarInitial}
              </Avatar>
              <TextField
                label="頭像 URL"
                fullWidth
                value={formState.image}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    image: event.target.value
                  }))
                }
                placeholder="https://..."
              />
            </Stack>

            <TextField
              label="使用者名稱"
              value={formState.username}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  username: event.target.value
                }))
              }
              helperText="2-24 個字元，可使用文字、數字、空白、底線或連字號"
              inputProps={{ maxLength: 24 }}
              required
            />

            <TextField
              label="自我簡介"
              value={formState.bio}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  bio: event.target.value.slice(0, 100)
                }))
              }
              multiline
              rows={4}
              helperText={`${formState.bio.length}/100`}
            />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? '儲存中...' : '儲存變更'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setFormState(originalState);
                }}
              >
                重設
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card component="section">
        <CardHeader
          title="興趣標籤"
          subheader="可多選，幫助系統推薦更適合的聊天對象"
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {hobbies.map((hobby) => (
              <Box
                key={hobby.id}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedHobbies.has(hobby.slug)}
                      onChange={() => toggleHobby(hobby.slug)}
                    />
                  }
                  label={<Typography fontWeight={500} component="span">{hobby.name}</Typography>}
                />
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="contained"
              onClick={handleHobbySubmit}
              disabled={isSavingHobbies}
            >
              {isSavingHobbies ? '儲存中...' : '更新興趣'}
            </Button>
            <Button
              variant="text"
              onClick={() =>
                setSelectedHobbies(
                  new Set(
                    hobbies
                      .filter((hobby) => hobby.selected)
                      .map((hobby) => hobby.slug)
                  )
                )
              }
            >
              還原
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(snackbar)}
        onClose={() => setSnackbar(null)}
        message={snackbar?.message}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack>
  );
}

