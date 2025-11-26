import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ChatRoom from '@/components/chat/ChatRoom';
import { authOptions } from '@/lib/auth';
import {
  findConversationById,
  getConversationDetail,
  listMessages
} from '@/lib/conversation';

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ConversationPage(props: ConversationPageProps) {
  const { conversationId } = await props.params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/chat/${conversationId}`);
  }

  const access = await findConversationById(conversationId, session.user.id);

  if (!access) {
    notFound();
  }

  const conversation = await getConversationDetail(conversationId);

  if (!conversation) {
    notFound();
  }

  const messages = await listMessages(conversationId);

  return (
    <ChatRoom
      conversationId={conversation.id}
      conversation={{
        id: conversation.id,
        title: conversation.title,
        isGroup: conversation.isGroup,
        participants: conversation.participants.map((participant) => ({
          id: participant.id,
          role: participant.role,
          isActive: participant.isActive,
          user: {
            id: participant.user.id,
            username: participant.user.username,
            image: participant.user.image
          }
        }))
      }}
      initialMessages={messages}
      currentUserId={session.user.id}
    />
  );
}

