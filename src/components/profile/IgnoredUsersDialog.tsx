'use client';

import { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';

import { apiClient } from '@/lib/api';

type IgnoredUser = {
    id: string;
    username: string;
    image: string | null;
    bio: string | null;
    type: 'PASS' | 'UNMATCH';
};

type IgnoredUsersDialogProps = {
    open: boolean;
    onClose: () => void;
};

export default function IgnoredUsersDialog({ open, onClose }: IgnoredUsersDialogProps) {
    const [users, setUsers] = useState<IgnoredUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/user/ignored');
            setUsers(response.data.users);
        } catch (error) {
            console.error('Failed to fetch ignored users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const handleRestore = async (userId: string) => {
        setRestoringId(userId);
        try {
            await apiClient.post('/api/user/ignored/restore', { targetId: userId });
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (error) {
            console.error('Failed to restore user', error);
        } finally {
            setRestoringId(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                已略過/解除配對的用戶
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : users.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">目前沒有已略過或解除配對的用戶</Typography>
                    </Box>
                ) : (
                    <List>
                        {users.map((user) => (
                            <ListItem
                                key={user.id}
                                secondaryAction={
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<RestoreIcon />}
                                        onClick={() => handleRestore(user.id)}
                                        disabled={restoringId === user.id}
                                    >
                                        {restoringId === user.id ? '恢復中...' : '恢復配對'}
                                    </Button>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar src={user.image || undefined}>
                                        {user.username[0]?.toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.username}
                                    secondary={user.type === 'PASS' ? '已略過' : '已解除配對'}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>關閉</Button>
            </DialogActions>
        </Dialog>
    );
}
