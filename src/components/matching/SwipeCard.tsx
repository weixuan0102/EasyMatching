import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography
} from '@mui/material';

type Candidate = {
    id: string;
    username: string;
    image: string | null;
    bio: string | null;
    hobbies: string[];
};

type SwipeCardProps = {
    candidate: Candidate;
};

export default function SwipeCard({ candidate }: SwipeCardProps) {
    const MAX_VISIBLE_HOBBIES = 5;
    const visibleHobbies = candidate.hobbies.slice(0, MAX_VISIBLE_HOBBIES);
    const hiddenCount = candidate.hobbies.length - MAX_VISIBLE_HOBBIES;

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: 360,
                height: 'auto',
                maxHeight: '100%', // Allow shrinking within parent
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: 3
            }}
        >
            <Box
                sx={{
                    height: 240,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0
                }}
            >
                {candidate.image ? (
                    <Box
                        component="img"
                        src={candidate.image}
                        alt={candidate.username}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <Avatar
                        sx={{
                            width: 100,
                            height: 100,
                            fontSize: 40,
                            bgcolor: 'primary.main'
                        }}
                    >
                        {candidate.username[0]?.toUpperCase()}
                    </Avatar>
                )}
            </Box>

            <CardContent sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    {candidate.username}
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                    {visibleHobbies.map((hobby) => (
                        <Chip
                            key={hobby}
                            label={hobby}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                    {hiddenCount > 0 && (
                        <Chip label={`+${hiddenCount}`} size="small" variant="outlined" />
                    )}
                </Stack>

                <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {candidate.bio || '這位使用者很懶，沒有寫自我介紹。'}
                </Typography>
            </CardContent>
        </Card>
    );
}
