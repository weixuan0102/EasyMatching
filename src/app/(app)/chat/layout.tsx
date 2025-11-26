import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import ChatShell from '@/components/chat/ChatShell';
import { authOptions } from '@/lib/auth';
import { listUserConversations } from '@/lib/conversation';

export default async function ChatLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/chat');
  }

  const conversations = await listUserConversations(session.user.id);

  return <ChatShell conversations={conversations}>{children}</ChatShell>;
}

