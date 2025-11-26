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
  replyTo: {
    id: string;
    content: string;
    sender: {
      username: string;
    };
  } | null;
  videoUrl: string | null;
  audioUrl: string | null;
};

type MessageListProps = {
  messages: MessageListItem[];
  currentUserId: string;
  onReply: (message: MessageListItem) => void;
};

export default function MessageList({
  messages,
  currentUserId,
  onReply
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
                  maxWidth: '70%',
                  '&:hover .reply-button': {
                    opacity: 1
                  }
                }}
              >
                <Stack direction="row" justifyContent={alignment}>
                  <Typography variant="caption" color="text.secondary">
                    {isSelf ? '我' : message.sender.username}
                  </Typography>
                </Stack>
                {message.replyTo && (
                  <Box
                    sx={{
                      bgcolor: 'action.hover',
                      p: 1,
                      borderRadius: 2,
                      mb: 0.5,
                      cursor: 'pointer',
                      borderLeft: 3,
                      borderColor: 'primary.main'
                    }}
                    onClick={() => {
                      const el = document.getElementById(`message-${message.replyTo?.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      回覆 {message.replyTo.sender.username}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.primary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {message.replyTo.content}
                    </Typography>
                  </Box>
                )}
                <Box
                  id={`message-${message.id}`}
                  sx={{
                    bgcolor: color,
                    color: textColor,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    borderTopRightRadius: isSelf ? 6 : 24,
                    borderTopLeftRadius: isSelf ? 24 : 6,
                    position: 'relative'
                  }}
                >
                  {message.imageUrl && (
                    <Box sx={{ mb: message.content ? 1 : 0 }}>
                      <img
                        src={message.imageUrl}
                        alt="Image"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          borderRadius: 8,
                          display: 'block'
                        }}
                      />
                    </Box>
                  )}
                  {message.videoUrl && (
                    <Box sx={{ mb: message.content ? 1 : 0 }}>
                      <video
                        src={message.videoUrl}
                        controls
                        style={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          borderRadius: 8,
                          display: 'block'
                        }}
                      />
                    </Box>
                  )}
                  {message.audioUrl && (
                    <Box sx={{ mb: message.content ? 1 : 0 }}>
                      <audio src={message.audioUrl} controls style={{ maxWidth: '100%' }} />
                    </Box>
                  )}
                  {message.content && (
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
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={alignment}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {dayjs(message.createdAt).format('YYYY/MM/DD HH:mm')}
                  </Typography>
                  <Typography
                    className="reply-button"
                    variant="caption"
                    sx={{
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      color: 'primary.main',
                      fontWeight: 500
                    }}
                    onClick={() => onReply(message)}
                  >
                    回覆
                  </Typography>
                </Stack>
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

