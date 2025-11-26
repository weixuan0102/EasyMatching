'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useSession } from 'next-auth/react';

import ChatList, { type ConversationListItem } from '@/components/chat/ChatList';
import { getPusherClient } from '@/lib/pusher-client';

type ChatShellProps = {
  conversations: ConversationListItem[];
  children: ReactNode;
};

export default function ChatShell({ conversations, children }: ChatShellProps) {
  const { data: session } = useSession();
  const [conversationState, setConversationState] =
    useState<ConversationListItem[]>(conversations);

  const userChannel = useMemo(() => {
    if (!session?.user?.id) {
      return null;
    }
    return `user-${session.user.id}`;
  }, [session?.user?.id]);

  useEffect(() => {
    setConversationState(conversations);
  }, [conversations]);

  useEffect(() => {
    if (!userChannel) {
      return;
    }

    const client = getPusherClient();
    const channel = client.subscribe(userChannel);

    const handleNewConversation = (conversation: ConversationListItem) => {
      setConversationState((prev) => {
        const exists = prev.some((item) => item.id === conversation.id);
        if (exists) {
          return prev;
        }
        return [conversation, ...prev];
      });
    };

    const handleUpdatedConversation = (conversation: ConversationListItem) => {
      setConversationState((prev) => {
        const exists = prev.some((item) => item.id === conversation.id);
        if (!exists) {
          return prev;
        }
        return prev.map((item) =>
          item.id === conversation.id ? conversation : item
        );
      });
    };

    channel.bind('conversation:new', handleNewConversation);
    channel.bind('conversation:update', handleUpdatedConversation);

    return () => {
      channel.unbind('conversation:new', handleNewConversation);
      channel.unbind('conversation:update', handleUpdatedConversation);
      client.unsubscribe(userChannel);
    };
  }, [userChannel]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', lg: 320 },
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <ChatList conversations={conversationState} />
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

