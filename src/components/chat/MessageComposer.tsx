'use client';

import { FormEvent, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { type MessageListItem } from './MessageList';

type MessageComposerProps = {
  onSend: (data: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string }) => Promise<void>;
  replyTo: MessageListItem | null;
  onCancelReply: () => void;
};

export default function MessageComposer({
  onSend,
  replyTo,
  onCancelReply
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (3MB = 3 * 1024 * 1024 bytes)
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('檔案大小超過限制 (最大 3MB)');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('無法存取麥克風，請檢查權限設定');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClearAudio = () => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('檔案上傳失敗');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile && !audioBlob) || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const payload: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string } = {};

      if (message.trim()) {
        payload.content = message.trim();
      }

      if (selectedFile) {
        const fileUrl = await uploadFile(selectedFile);
        const fileType = selectedFile.type;

        if (fileType.startsWith('image/')) {
          payload.imageUrl = fileUrl;
        } else if (fileType.startsWith('video/')) {
          payload.videoUrl = fileUrl;
        }
      }

      if (audioBlob) {
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        const audioUrl = await uploadFile(audioFile);
        payload.audioUrl = audioUrl;
      }

      await onSend(payload);
      setMessage('');
      handleClearFile();
      handleClearAudio();
    } catch (error) {
      console.error('送訊息失敗:', error);
      alert('訊息傳送失敗，請稍後再試');
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

  const fileType = selectedFile?.type.startsWith('image/') ? 'image' : 'video';

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      {replyTo && (
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                width: 4,
                height: 32,
                bgcolor: 'primary.main',
                borderRadius: 1,
                flexShrink: 0
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="primary.main" fontWeight="bold">
                回覆 {replyTo.sender.username}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {replyTo.content}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* File Preview */}
      {selectedFile && filePreview && (
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          {fileType === 'image' ? (
            <img src={filePreview} alt="Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }} />
          ) : (
            <video src={filePreview} style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }} />
          )}
          <Typography variant="caption" sx={{ flex: 1 }}>{selectedFile.name}</Typography>
          <IconButton size="small" onClick={handleClearFile}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Audio Preview */}
      {audioBlob && (
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <MicIcon color="primary" />
          <Typography variant="caption" sx={{ flex: 1 }}>錄音檔案</Typography>
          <IconButton size="small" onClick={handleClearAudio}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 2, md: 3 },
          py: 2
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Tooltip title="附加檔案">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !!selectedFile || !!audioBlob}
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isRecording ? '停止錄音' : '錄音'}>
          <IconButton
            size="small"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || !!selectedFile || (!!audioBlob && !isRecording)}
            color={isRecording ? 'error' : 'default'}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

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
          disabled={isSending}
        />
        <Tooltip title="送出訊息">
          <span>
            <IconButton
              type="submit"
              color="primary"
              disabled={isSending || (!message.trim() && !selectedFile && !audioBlob)}
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
    </Box>
  );
}
