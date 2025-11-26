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

        channel.bind('message:new', handleIncomingMessage);

        return () => {
            channel.unbind('message:new', handleIncomingMessage);
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

    return {
        messages,
        error,
        sendMessage,
        clearError
    };
};
