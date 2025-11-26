'use client';

import { useMemo, useState } from 'react';
import { Avatar, Box, Divider, Snackbar, Stack, Typography } from '@mui/material';

import MessageComposer from '@/components/chat/MessageComposer';
import MessageList, {
  type MessageListItem
} from '@/components/chat/MessageList';
import { useChat } from '@/hooks/useChat';
import { getConversationTitle } from '@/utils/chat';

type ConversationParticipant = {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
};

type ConversationSummary = {
  id: string;
  title: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
};

type ChatRoomProps = {
  conversationId: string;
  conversation: ConversationSummary;
  initialMessages: MessageListItem[];
  currentUserId: string;
};



export default function ChatRoom({
  conversationId,
  conversation,
  initialMessages,
  currentUserId
}: ChatRoomProps) {
  const { messages, error, sendMessage, editMessage, deleteMessage, clearError } = useChat({
    conversationId,
    initialMessages
  });
  const [replyTo, setReplyTo] = useState<MessageListItem | null>(null);

  const handleSend = async (data: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string }) => {
    await sendMessage(data, replyTo?.id);
    setReplyTo(null);
  };

  const title = useMemo(
    () => getConversationTitle(conversation, currentUserId),
    [conversation, currentUserId]
  );

  const avatarUser = conversation.isGroup
    ? null
    : conversation.participants.find(
      (participant) => participant.user.id !== currentUserId
    )?.user;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Avatar
          src={avatarUser?.image ?? undefined}
          alt={title}
          sx={{ width: 48, height: 48 }}
        >
          {title[0]}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {conversation.participants.length} 位成員
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onReply={setReplyTo}
          onEdit={editMessage}
          onDelete={deleteMessage}
        />
      </Box>
      <Divider />
      <MessageComposer
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
      <Snackbar
        open={Boolean(error)}
        onClose={clearError}
        message={error}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

