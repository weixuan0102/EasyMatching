import {
    Avatar,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type UserProfileDialogProps = {
    open: boolean;
    onClose: () => void;
    user: {
        id: string;
        username: string;
        image: string | null;
        bio: string | null;
        hobbies: string[];
    } | null;
};

export default function UserProfileDialog({
    open,
    onClose,
    user
}: UserProfileDialogProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ position: 'relative', textAlign: 'center', pb: 1, fontWeight: 700 }}>
                用戶資料
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} alignItems="center">
                    {/* Profile Image */}
                    <Box sx={{ position: 'relative' }}>
                        {user.image ? (
                            <Avatar
                                src={user.image}
                                alt={user.username}
                                sx={{ width: 200, height: 200, fontSize: 64 }}
                            />
                        ) : (
                            <Avatar sx={{ width: 200, height: 200, fontSize: 64 }}>
                                {user.username[0]?.toUpperCase()}
                            </Avatar>
                        )}
                    </Box>

                    {/* Username */}
                    <Typography variant="h5" fontWeight={700}>
                        {user.username}
                    </Typography>

                    {/* Bio */}
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            自我介紹
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {user.bio || '這個人很懶，什麼都沒寫...'}
                        </Typography>
                    </Box>

                    {/* Hobbies */}
                    {user.hobbies && user.hobbies.length > 0 && (
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                興趣愛好
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {user.hobbies.map((hobby) => (
                                    <Chip
                                        key={hobby}
                                        label={hobby}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
