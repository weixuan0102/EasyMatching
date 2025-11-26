'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar, Box, Chip, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { detectAndRenderLinks } from '@/utils/linkDetection';
import LinkConfirmDialog from '@/components/common/LinkConfirmDialog';
import EditMessageDialog from '@/components/chat/EditMessageDialog';

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
  editedAt: string | null;
  isDeleted: boolean;
};

type MessageListProps = {
  messages: MessageListItem[];
  currentUserId: string;
  onReply: (message: MessageListItem) => void;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
};

export default function MessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageListItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; messageId: string } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLinkClick = (url: string) => {
    setLinkUrl(url);
  };

  const handleConfirmLink = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      setLinkUrl(null);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, messageId: string) => {
    setMenuAnchor({ el: event.currentTarget, messageId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditClick = () => {
    const message = messages.find(m => m.id === menuAnchor?.messageId);
    if (message) {
      setEditingMessage(message);
    }
    handleMenuClose();
  };

  const handleDeleteClick = async () => {
    const messageId = menuAnchor?.messageId;
    handleMenuClose();

    if (messageId && window.confirm('確定要刪除此訊息嗎？')) {
      try {
        await onDelete(messageId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleSaveEdit = async (newContent: string) => {
    if (editingMessage) {
      await onEdit(editingMessage.id, newContent);
      setEditingMessage(null);
    }
  };

  const canEditOrDelete = (message: MessageListItem) => {
    if (message.senderId !== currentUserId || message.isDeleted) return false;
    const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();
    return timeSinceCreation <= 5 * 60 * 1000; // 5 minutes
  };

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
                  '&:hover .message-actions': {
                    opacity: 1
                  }
                }}
              >
                <Stack direction="row" justifyContent={alignment} alignItems="center" spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    {isSelf ? '我' : message.sender.username}
                  </Typography>
                  {message.editedAt && (
                    <Chip label="已編輯" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Stack>
                {message.replyTo && !message.isDeleted && (
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
                    bgcolor: message.isDeleted ? 'action.disabledBackground' : color,
                    color: message.isDeleted ? 'text.disabled' : textColor,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    borderTopRightRadius: isSelf ? 6 : 24,
                    borderTopLeftRadius: isSelf ? 24 : 6,
                    position: 'relative'
                  }}
                >
                  {message.isDeleted ? (
                    <Typography variant="body2" fontStyle="italic">
                      訊息已刪除
                    </Typography>
                  ) : (
                    <>
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
                          {detectAndRenderLinks(
                            message.content,
                            handleLinkClick,
                            isSelf ? '#e3f2fd' : '#1565c0'
                          )}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={alignment}>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(message.createdAt).format('YYYY/MM/DD HH:mm')}
                  </Typography>
                  {!message.isDeleted && (
                    <Stack
                      className="message-actions"
                      direction="row"
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          fontWeight: 500
                        }}
                        onClick={() => onReply(message)}
                      >
                        回覆
                      </Typography>
                      {canEditOrDelete(message) && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, message.id)}
                          sx={{ ml: 0.5, p: 0.5 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  )}
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

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>編輯</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>刪除</MenuItem>
      </Menu>

      <LinkConfirmDialog
        open={Boolean(linkUrl)}
        url={linkUrl}
        onClose={() => setLinkUrl(null)}
        onConfirm={handleConfirmLink}
      />

      <EditMessageDialog
        open={Boolean(editingMessage)}
        initialContent={editingMessage?.content ?? ''}
        onClose={() => setEditingMessage(null)}
        onSave={handleSaveEdit}
      />
    </Box>
  );
}
