'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Avatar,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useSession } from 'next-auth/react';

import { getConversationTitle } from '@/utils/chat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

type Participant = {
  id: string;
  role: string;
  user: {
    id: string;
    uid: string;
    username: string;
    image: string | null;
  };
};

type LatestMessage = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    image: string | null;
  };
};

export type ConversationListItem = {
  id: string;
  title: string | null;
  isGroup: boolean;
  creatorId: string | null;
  lastMessageAt: string;
  participants: Participant[];
  latestMessage: LatestMessage | null;
};



export default function ChatList({
  conversations
}: {
  conversations: ConversationListItem[];
}) {
  const params = useParams<{ conversationId?: string }>();
  const { data: session } = useSession();

  const activeId = params?.conversationId ?? null;

  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) =>
        dayjs(b.lastMessageAt).diff(dayjs(a.lastMessageAt))
      ),
    [conversations]
  );

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          我的對話
        </Typography>
        <Typography variant="body2" color="text.secondary">
          總共 {conversations.length} 個聊天室
        </Typography>
      </Box>

      <List
        sx={{
          p: 0,
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto'
        }}
      >
        {sorted.map((conversation) => {
          const name = getConversationTitle(conversation, session?.user?.id);
          const isActive = activeId === conversation.id;
          const secondary = conversation.latestMessage
            ? `${conversation.latestMessage.sender.username}: ${conversation.latestMessage.content.slice(0, 32)}`
            : '尚無訊息';
          const timestamp = conversation.latestMessage
            ? dayjs(conversation.latestMessage.createdAt).fromNow()
            : '';
          const avatarParticipant = conversation.isGroup
            ? null
            : conversation.participants.find(
              (participant) => participant.user.id !== session?.user?.id
            );

          return (
            <ListItemButton
              key={conversation.id}
              component={Link}
              href={`/chat/${conversation.id}`}
              selected={isActive}
              sx={{
                alignItems: 'flex-start',
                gap: 2,
                py: 2,
                px: 3,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '& .MuiTypography-root': {
                    color: 'primary.contrastText'
                  }
                }
              }}
            >
              <Avatar
                sx={{ width: 48, height: 48 }}
                src={avatarParticipant?.user.image ?? undefined}
              >
                {name[0]}
              </Avatar>
              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={600}>{name}</Typography>
                    <Typography
                      variant="caption"
                      color={isActive ? 'inherit' : 'text.secondary'}
                    >
                      {timestamp}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color={isActive ? 'inherit' : 'text.secondary'}
                    noWrap
                  >
                    {secondary}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}

        {sorted.length === 0 && (
          <Box sx={{ px: 3, py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              尚未開始任何對話，快去建立新的聊天吧！
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
}

