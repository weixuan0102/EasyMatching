'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';

import SwipeCard from '@/components/matching/SwipeCard';
import { apiClient } from '@/lib/api';

type Candidate = {
  id: string;
  username: string;
  image: string | null;
  bio: string | null;
  hobbies: string[];
};

export default function MatchingPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [matchData, setMatchData] = useState<{ match: boolean; username: string } | null>(null);

  const fetchCandidates = async () => {
    try {
      const response = await apiClient.get('/api/matching/candidates');
      setCandidates(response.data.candidates);
      setRemainingSwipes(response.data.remainingSwipes);
      setLimitReached(response.data.limitReached);
    } catch (error) {
      console.error('Failed to fetch candidates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSwipe = async (action: 'LIKE' | 'PASS') => {
    if (candidates.length === 0) return;

    const currentCandidate = candidates[0];
    // Optimistic update
    setCandidates((prev) => prev.slice(1));
    if (remainingSwipes !== null) {
      setRemainingSwipes((prev) => (prev !== null ? prev - 1 : 0));
    }

    try {
      const response = await apiClient.post('/api/matching/swipe', {
        targetId: currentCandidate.id,
        action
      });

      if (response.data.match) {
        setMatchData({ match: true, username: currentCandidate.username });
      }

      setRemainingSwipes(response.data.remainingSwipes);

      if (response.data.remainingSwipes === 0) {
        setLimitReached(true);
      }
    } catch (error: any) {
      console.error('Swipe failed', error);
      if (error.response?.status === 403) { // Limit reached
        setLimitReached(true);
        setRemainingSwipes(0);
      } else {
        // Revert optimistic update if needed? 
        // For now, just let it be, maybe fetch again
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (limitReached) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          今日配對次數已達上限
        </Typography>
        <Typography color="text.secondary">
          每天只能滑 20 次喔！明天再來吧！
        </Typography>
      </Box>
    );
  }

  if (candidates.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          暫時沒有更多對象
        </Typography>
        <Typography color="text.secondary">
          請稍後再來看看，或調整您的個人資料。
        </Typography>
        <Button variant="outlined" onClick={() => fetchCandidates()}>
          重新整理
        </Button>
      </Box>
    );
  }

  const currentCandidate = candidates[0];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      py: 2,
      maxHeight: 'calc(100vh - 64px)', // Subtract header height approx
      overflow: 'hidden'
    }}>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        今日剩餘次數：{remainingSwipes}
      </Typography>

      <Box sx={{
        flex: 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 0, // Allow shrinking
        py: 2
      }}>
        <SwipeCard candidate={currentCandidate} />
      </Box>

      <Stack direction="row" spacing={4} mt={1} mb={2}>
        <IconButton
          onClick={() => handleSwipe('PASS')}
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'background.paper',
            boxShadow: 3,
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', color: 'white' }
          }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>

        <IconButton
          onClick={() => handleSwipe('LIKE')}
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'background.paper',
            boxShadow: 3,
            color: 'success.main',
            '&:hover': { bgcolor: 'success.light', color: 'white' }
          }}
        >
          <FavoriteIcon fontSize="large" />
        </IconButton>
      </Stack>

      <Dialog open={!!matchData} onClose={() => setMatchData(null)}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>
          It&apos;s a Match!
        </DialogTitle>
        <DialogContent>
          <DialogContentText textAlign="center">
            你和 {matchData?.username} 互相喜歡！
            <br />
            現在可以開始聊天囉！
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setMatchData(null)} color="inherit">
            繼續滑
          </Button>
          <Button variant="contained" onClick={() => router.push('/chat')}>
            前往聊天
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
