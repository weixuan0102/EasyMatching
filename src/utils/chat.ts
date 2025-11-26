export type ConversationParticipant = {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
};

export const getConversationTitle = (
  conversation: ConversationSummary,
  currentUserId: string | undefined
) => {
  if (conversation.isGroup && conversation.title) {
    return conversation.title;
  }

  const other = conversation.participants.find(
    (participant) => participant.user.id !== currentUserId
  );

  return other?.user.username ?? '未命名對話';
};
