'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

import { apiClient } from '@/lib/api';
import { type MatchingResult } from '@/lib/matching';

type MatchingViewProps = {
  initialMatches: MatchingResult[];
  currentUserId: string;
};

const formatSharedLabel = (count: number) => {
  if (count <= 0) {
    return '沒有共同興趣';
  }
  return `共同興趣 ${count} 項`;
};

export default function MatchingView({
  initialMatches,
  currentUserId
}: MatchingViewProps) {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchingResult[]>(initialMatches);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);
    try {
      const response = await apiClient.get('/api/matching', {
        params: {
          search: search.trim().length > 0 ? search.trim() : undefined
        }
      });
      setMatches(response.data.matches);
    } catch {
      setSnackbar('搜尋失敗，請稍後再試。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = async () => {
    if (isSearching) {
      return;
    }
    setSearch('');
    setIsSearching(true);
    try {
      const response = await apiClient.get('/api/matching');
      setMatches(response.data.matches);
    } catch {
      setSnackbar('重新載入推薦結果失敗。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    setStartingChatId(targetUserId);
    try {
      const response = await apiClient.post('/api/conversations', {
        participantIds: [targetUserId]
      });
      const conversationId = response.data?.id ?? response.data?.conversation?.id;

      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      } else {
        setSnackbar('建立對話失敗，請稍後再試。');
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '建立對話失敗，請稍後再試。';
      setSnackbar(message);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            尋找聊天夥伴
          </Typography>
          <Typography variant="body2" color="text.secondary">
            我們依照共同興趣推薦適合的使用者，也可以輸入 userID 或使用者名稱搜尋。
          </Typography>
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ mt: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}
          >
            <TextField
              placeholder="搜尋 userID 或使用者名稱"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSearching}
                startIcon={
                  isSearching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />
                }
              >
                搜尋
              </Button>
              <IconButton onClick={handleReset} disabled={isSearching} color="primary">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2
        }}
      >
        {matches.map((match) => (
          <Card
            key={match.user.id}
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  src={match.user.image ?? undefined}
                  alt={match.user.username}
                  sx={{ width: 64, height: 64 }}
                >
                  {match.user.username?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
                <Stack spacing={0.5} flexGrow={1}>
                  <Typography variant="h6" fontWeight={700}>
                    {match.user.username || match.user.loginId || '未命名使用者'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    userID：{match.user.loginId ?? '未設定'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatSharedLabel(match.sharedCount)}
                  </Typography>
                </Stack>
              </Stack>

              {match.sharedHobbies.length > 0 && (
                <Stack spacing={1.5} mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    共同興趣
                  </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {match.sharedHobbies.map((hobby) => (
                        <Chip key={hobby.id} label={hobby.name} color="primary" size="small" />
                      ))}
                    </Box>
                </Stack>
              )}

              {match.otherHobbies.length > 0 && (
                <Stack spacing={1.5} mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    對方的其他興趣
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {match.otherHobbies.map((hobby) => (
                      <Chip key={hobby.id} label={hobby.name} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Stack>
              )}

              {match.user.bio && (
                <Stack spacing={1} mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    自我介紹
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                    {match.user.bio}
                  </Typography>
                </Stack>
              )}
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end', px: 3, py: 2 }}>
              <Button
                variant="contained"
                startIcon={<ChatBubbleIcon />}
                disabled={
                  startingChatId === match.user.id ||
                  match.user.id === currentUserId ||
                  match.sharedCount === 0
                }
                onClick={() => handleStartChat(match.user.id)}
              >
                {startingChatId === match.user.id ? '建立中...' : '開始聊天'}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {matches.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          目前沒有符合條件的使用者，可以調整搜尋關鍵字或稍後再試。
        </Alert>
      )}

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack>
  );
}


