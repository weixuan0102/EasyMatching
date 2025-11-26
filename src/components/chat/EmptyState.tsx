'use client';

import { Box, Typography } from '@mui/material';

export default function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 4
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          選擇一個對話開始聊天
        </Typography>
        <Typography variant="body1" color="text.secondary">
          左側列出了所有聊天室，點擊即可查看訊息或開始新的聊天。
        </Typography>
      </Box>
    </Box>
  );
}

