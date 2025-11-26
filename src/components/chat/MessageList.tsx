'use client';

import { useEffect, useRef } from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export type MessageListItem = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    uid: string;
    username: string;
    image: string | null;
  };
};

type MessageListProps = {
  messages: MessageListItem[];
  currentUserId: string;
};

export default function MessageList({
  messages,
  currentUserId
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: 3,
        bgcolor: 'background.default'
      }}
    >
      <Stack spacing={2}>
        {messages.map((message, index) => {
          const isSelf = message.senderId === currentUserId;
          const alignment = isSelf ? 'flex-end' : 'flex-start';
          const color = isSelf ? 'primary.main' : 'grey.200';
          const textColor = isSelf ? 'primary.contrastText' : 'text.primary';

          return (
            <Stack
              key={`${message.id}-${index}`}
              direction="row"
              justifyContent={alignment}
              spacing={1.5}
              sx={{ width: '100%' }}
            >
              {!isSelf && (
                <Avatar
                  src={message.sender.image ?? undefined}
                  alt={message.sender.username}
                  sx={{ width: 36, height: 36 }}
                >
                  {message.sender.username[0]}
                </Avatar>
              )}
              <Stack
                spacing={0.5}
                alignItems={alignment}
                sx={{
                  maxWidth: '70%'
                }}
              >
                <Stack direction="row" justifyContent={alignment}>
                  <Typography variant="caption" color="text.secondary">
                    {isSelf ? '我' : message.sender.username}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    bgcolor: color,
                    color: textColor,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    borderTopRightRadius: isSelf ? 6 : 24,
                    borderTopLeftRadius: isSelf ? 24 : 6
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {message.content}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: alignment }}
                >
                  {dayjs(message.createdAt).format('YYYY/MM/DD HH:mm')}
                </Typography>
              </Stack>
              {isSelf && (
                <Avatar
                  sx={{ width: 36, height: 36 }}
                  src={message.sender.image ?? undefined}
                >
                  {message.sender.username[0]}
                </Avatar>
              )}
            </Stack>
          );
        })}
      </Stack>
      <div ref={bottomRef} />
    </Box>
  );
}

