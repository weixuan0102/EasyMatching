'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
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

import { apiClient } from '@/lib/api';
import UserProfileDialog from '@/components/common/UserProfileDialog';

type Liker = {
    id: string;
    username: string;
    image: string | null;
    bio: string | null;
    hobbies: string[];
    likedAt: string;
};

export default function LikesPage() {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const [likes, setLikes] = useState<Liker[]>([]);
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState<{ match: boolean; username: string } | null>(null);
    const [selectedUser, setSelectedUser] = useState<Liker | null>(null);

    const fetchLikes = async () => {
        try {
            const response = await apiClient.get('/api/matching/likes');
            setLikes(response.data.likes);
        } catch (error) {
            console.error('Failed to fetch likes', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLikes();
    }, []);

    const handleAction = async (targetId: string, action: 'LIKE' | 'PASS') => {
        // Optimistic remove from list
        setLikes((prev) => prev.filter((l) => l.id !== targetId));

        // Optimistic update for badge count
        mutate('/api/user/likes/count', (data: { count: number } | undefined) => {
            return { count: Math.max(0, (data?.count ?? 1) - 1) };
        }, false);

        try {
            const response = await apiClient.post('/api/matching/swipe', {
                targetId,
                action
            });

            // Revalidate to ensure sync with server
            mutate('/api/user/likes/count');

            if (response.data.match) {
                const user = likes.find((l) => l.id === targetId);
                if (user) {
                    setMatchData({ match: true, username: user.username });
                }
            }
        } catch (error) {
            console.error('Action failed', error);
            // Revert if needed (optional, but good practice would be to re-fetch)
            mutate('/api/user/likes/count');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (likes.length === 0) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                    目前沒有新的喜歡
                </Typography>
                <Typography color="text.secondary">
                    去滑滑卡片，增加曝光機會吧！
                </Typography>
                <Button variant="contained" onClick={() => router.push('/matching')}>
                    去配對
                </Button>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>
                誰喜歡我 ({likes.length})
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {likes.map((liker) => (
                    <Box
                        key={liker.id}
                        sx={{
                            width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Card
                            sx={{
                                borderRadius: 4,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => setSelectedUser(liker)}
                        >
                            <Box sx={{ height: 200, bgcolor: 'grey.200', position: 'relative' }}>
                                {liker.image ? (
                                    <Box
                                        component="img"
                                        src={liker.image}
                                        alt={liker.username}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
                                            {liker.username[0]?.toUpperCase()}
                                        </Avatar>
                                    </Box>
                                )}
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    {liker.username}
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={0.5} mb={1}>
                                    {liker.hobbies.slice(0, 3).map((hobby) => (
                                        <Chip key={hobby} label={hobby} size="small" variant="outlined" />
                                    ))}
                                    {liker.hobbies.length > 3 && (
                                        <Chip label={`+${liker.hobbies.length - 3}`} size="small" variant="outlined" />
                                    )}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {liker.bio || '沒有自我介紹'}
                                </Typography>
                            </CardContent>
                            <Stack direction="row" spacing={1} p={2} pt={0} onClick={(e) => e.stopPropagation()}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CloseIcon />}
                                    onClick={() => handleAction(liker.id, 'PASS')}
                                >
                                    跳過
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FavoriteIcon />}
                                    onClick={() => handleAction(liker.id, 'LIKE')}
                                >
                                    喜歡
                                </Button>
                            </Stack>
                        </Card>
                    </Box>
                ))}
            </Box>

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
                        繼續查看
                    </Button>
                    <Button variant="contained" onClick={() => router.push('/chat')}>
                        前往聊天
                    </Button>
                </DialogActions>
            </Dialog>

            <UserProfileDialog
                open={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                user={selectedUser}
            />
        </Container>
    );
}
