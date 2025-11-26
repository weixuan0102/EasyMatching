'use client';

import { FormEvent, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

type MessageComposerProps = {
  onSend: (content: string) => Promise<void>;
};

export default function MessageComposer({ onSend }: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(message.trim());
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <TextField
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="輸入訊息... (Enter 送出，Shift+Enter 換行)"
        size="small"
        fullWidth
        multiline
        maxRows={4}
        inputProps={{ maxLength: 500 }}
      />
      <Tooltip title="送出訊息">
        <span>
          <IconButton
            type="submit"
            color="primary"
            disabled={isSending || message.trim().length === 0}
          >
            {isSending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

