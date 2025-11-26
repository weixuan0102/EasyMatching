'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import ReportIcon from '@mui/icons-material/Report';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import MessageComposer from '@/components/chat/MessageComposer';
import MessageList, {
  type MessageListItem
} from '@/components/chat/MessageList';
import ReportDialog from '@/components/chat/ReportDialog';
import { useChat } from '@/hooks/useChat';
import { getConversationTitle } from '@/utils/chat';
import { apiClient } from '@/lib/api';

type ConversationParticipant = {
  id: string;
  role: string;
  isActive: boolean;
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
  const router = useRouter();
  const { messages, error, sendMessage, editMessage, deleteMessage, clearError } = useChat({
    conversationId,
    initialMessages
  });
  const [replyTo, setReplyTo] = useState<MessageListItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleSend = async (data: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string }) => {
    await sendMessage(data, replyTo?.id);
    setReplyTo(null);
  };

  const title = useMemo(
    () => getConversationTitle(conversation, currentUserId),
    [conversation, currentUserId]
  );

  const currentUserParticipant = useMemo(
    () => conversation.participants.find((p) => p.user.id === currentUserId),
    [conversation, currentUserId]
  );

  const isUnmatched = !currentUserParticipant?.isActive;

  const otherUser = useMemo(
    () => conversation.participants.find((p) => p.user.id !== currentUserId)?.user,
    [conversation, currentUserId]
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleUnmatch = async () => {
    handleMenuClose();

    if (!window.confirm(`確定要解除與 ${otherUser?.username || '此用戶'} 的配對嗎？`)) {
      return;
    }

    try {
      await apiClient.post(`/api/conversations/${conversationId}/unmatch`);
      router.refresh();
    } catch (error: any) {
      console.error('Unmatch failed:', error);
      const errorMessage = error.response?.data?.error || '解除配對失敗，請稍後再試';
      alert(errorMessage);
    }
  };

  const handleRestore = async () => {
    try {
      await apiClient.post(`/api/conversations/${conversationId}/restore`);
      router.refresh();
    } catch (error: any) {
      console.error('Restore failed:', error);
      const errorMessage = error.response?.data?.error || '恢復配對失敗，請稍後再試';
      alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('確定要永久刪除此對話嗎？此操作無法復原。')) {
      return;
    }

    try {
      await apiClient.delete(`/api/conversations/${conversationId}/delete`);
      router.push('/chat');
    } catch (error: any) {
      console.error('Delete failed:', error);
      const errorMessage = error.response?.data?.error || '刪除對話失敗，請稍後再試';
      alert(errorMessage);
    }
  };

  const handleReportClick = () => {
    handleMenuClose();
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async (data: {
    reportedUserId: string;
    conversationId?: string;
    reason: string;
    description?: string;
  }) => {
    await apiClient.post('/api/reports', data);
  };

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
          src={otherUser?.image ?? undefined}
          alt={title}
          sx={{ width: 48, height: 48 }}
        >
          {title[0]}
        </Avatar>
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {conversation.participants.length} 位成員
          </Typography>
        </Stack>
        {!isUnmatched && (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleReportClick}>
                <ReportIcon sx={{ mr: 1 }} fontSize="small" />
                舉報
              </MenuItem>
              <MenuItem onClick={handleUnmatch} sx={{ color: 'error.main' }}>
                <BlockIcon sx={{ mr: 1 }} fontSize="small" />
                解除配對
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {isUnmatched && (
        <Alert
          severity="warning"
          sx={{ m: 2, borderRadius: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<RestoreIcon />}
                onClick={handleRestore}
                variant="outlined"
                color="warning"
              >
                恢復配對
              </Button>
              <Button
                size="small"
                startIcon={<DeleteForeverIcon />}
                onClick={handleDelete}
                variant="outlined"
                color="error"
              >
                永久刪除
              </Button>
            </Stack>
          }
        >
          您已解除與此用戶的配對
        </Alert>
      )}

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
      {!isUnmatched && (
        <MessageComposer
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
      <Snackbar
        open={Boolean(error)}
        onClose={clearError}
        message={error}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {otherUser && (
        <ReportDialog
          open={reportDialogOpen}
          reportedUserId={otherUser.id}
          reportedUsername={otherUser.username}
          conversationId={conversationId}
          onClose={() => setReportDialogOpen(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </Box>
  );
}
