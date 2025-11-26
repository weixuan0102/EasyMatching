import { useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { apiClient } from '@/lib/api';
import { type MessageListItem } from '@/components/chat/MessageList';

type UseChatProps = {
    conversationId: string;
    initialMessages: MessageListItem[];
};

export const useChat = ({ conversationId, initialMessages }: UseChatProps) => {
    const [messages, setMessages] = useState<MessageListItem[]>(initialMessages);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const client = getPusherClient();
        const channelName = `conversation-${conversationId}`;
        const channel = client.subscribe(channelName);

        const handleIncomingMessage = (message: MessageListItem) => {
            setMessages((prev) => {
                const exists = prev.some((item) => item.id === message.id);
                if (exists) {
                    return prev;
                }
                return [...prev, message];
            });
        };

        const handleMessageUpdate = (message: MessageListItem) => {
            setMessages((prev) =>
                prev.map((item) => (item.id === message.id ? message : item))
            );
        };

        const handleMessageDelete = (message: MessageListItem) => {
            setMessages((prev) =>
                prev.map((item) => (item.id === message.id ? message : item))
            );
        };

        channel.bind('message:new', handleIncomingMessage);
        channel.bind('message:updated', handleMessageUpdate);
        channel.bind('message:deleted', handleMessageDelete);

        return () => {
            channel.unbind('message:new', handleIncomingMessage);
            channel.unbind('message:updated', handleMessageUpdate);
            channel.unbind('message:deleted', handleMessageDelete);
            client.unsubscribe(channelName);
        };
    }, [conversationId]);

    const sendMessage = async (
        data: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string },
        replyToId?: string
    ) => {
        try {
            const response = await apiClient.post<MessageListItem>(
                `/api/conversations/${conversationId}/messages`,
                { ...data, replyToId }
            );

            const newMessage = response.data;
            setMessages((prev) => {
                const exists = prev.some((item) => item.id === newMessage.id);
                if (exists) {
                    return prev;
                }
                return [...prev, newMessage];
            });
        } catch {
            setError('訊息傳送失敗，請稍後再試');
        }
    };

    const clearError = () => setError(null);

    const editMessage = async (messageId: string, newContent: string) => {
        try {
            const response = await apiClient.patch<MessageListItem>(
                `/api/conversations/${conversationId}/messages/${messageId}`,
                { content: newContent }
            );

            const updatedMessage = response.data;
            setMessages((prev) =>
                prev.map((item) => (item.id === messageId ? updatedMessage : item))
            );
        } catch (error: any) {
            console.error('Edit message error:', error.response?.data || error);
            const errorMessage = error.response?.data?.error || '編輯訊息失敗，請稍後再試';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const response = await apiClient.delete<MessageListItem>(
                `/api/conversations/${conversationId}/messages/${messageId}`
            );

            const deletedMessage = response.data;
            setMessages((prev) =>
                prev.map((item) => (item.id === messageId ? deletedMessage : item))
            );
        } catch (error: any) {
            console.error('Delete message error:', error.response?.data || error);
            const errorMessage = error.response?.data?.error || '刪除訊息失敗，請稍後再試';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    return {
        messages,
        error,
        sendMessage,
        editMessage,
        deleteMessage,
        clearError
    };
};
