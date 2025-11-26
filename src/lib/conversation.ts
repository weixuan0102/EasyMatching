import { Prisma } from '@prisma/client';
import { pusherServer } from '@/lib/pusher-server';
import { prisma } from '@/lib/prisma';

const conversationInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          uid: true,
          username: true,
          image: true,
          bio: true
        }
      }
    }
  },
  messages: {
    orderBy: {
      createdAt: 'desc'
    },
    take: 1,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          image: true
        }
      }
    }
  }
} satisfies Prisma.ConversationInclude;

const messageInclude = {
  sender: {
    select: {
      id: true,
      uid: true,
      username: true,
      image: true
    }
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: {
        select: {
          username: true
        }
      }
    }
  }
} satisfies Prisma.MessageInclude;

type ConversationWithExtras = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

type MessageWithSender = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

const serializeConversation = (conversation: ConversationWithExtras) => {
  const latest = conversation.messages.at(0);
  return {
    id: conversation.id,
    title: conversation.title,
    isGroup: conversation.isGroup,
    creatorId: conversation.creatorId,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    participants: conversation.participants.map((participant) => ({
      id: participant.id,
      role: participant.role,
      joinedAt: participant.joinedAt,
      user: participant.user
    })),
    latestMessage: latest
      ? {
        id: latest.id,
        content: latest.content,
        imageUrl: latest.imageUrl,
        createdAt: latest.createdAt.toISOString(),
        sender: latest.sender
      }
      : null,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  };
};

const serializeMessage = (message: MessageWithSender) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  content: message.content,
  imageUrl: message.imageUrl,
  videoUrl: message.videoUrl,
  audioUrl: message.audioUrl,
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
  sender: message.sender,
  replyTo: message.replyTo
    ? {
      id: message.replyTo.id,
      content: message.replyTo.content,
      sender: {
        username: message.replyTo.sender.username
      }
    }
    : null
});

export const listUserConversations = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId
        }
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    },
    include: conversationInclude
  });

  return conversations.map(serializeConversation);
};

export const findConversationById = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        where: {
          userId
        }
      }
    }
  });

  if (!conversation || conversation.participants.length === 0) {
    return null;
  }

  return conversation;
};

type CreateConversationInput = {
  creatorId: string;
  participantIds: string[];
  isGroup?: boolean;
  title?: string;
};

export const createConversation = async ({
  creatorId,
  participantIds,
  isGroup = false,
  title
}: CreateConversationInput) => {
  const uniqueParticipantIds = Array.from(
    new Set([creatorId, ...participantIds.filter(Boolean)])
  );

  if (uniqueParticipantIds.length < 2) {
    throw new Error('至少需要兩位使用者才能建立對話');
  }

  if (!isGroup && uniqueParticipantIds.length !== 2) {
    throw new Error('一對一對話僅能包含兩位使用者');
  }

  if (isGroup && (!title || title.trim().length === 0)) {
    throw new Error('群組對話需要名稱');
  }

  if (!isGroup) {
    const otherUserId = uniqueParticipantIds.find((id) => id !== creatorId)!;

    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: {
              in: [creatorId, otherUserId]
            }
          }
        },
        AND: [
          {
            participants: {
              some: {
                userId: creatorId
              }
            }
          },
          {
            participants: {
              some: {
                userId: otherUserId
              }
            }
          }
        ]
      },
      include: conversationInclude
    });

    if (existing) {
      return serializeConversation(existing);
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      creatorId,
      isGroup,
      title: isGroup ? title : null,
      participants: {
        create: uniqueParticipantIds.map((userId) => ({
          userId,
          role: userId === creatorId ? 'owner' : 'member'
        }))
      }
    },
    include: conversationInclude
  });

  const serialized = serializeConversation(conversation);

  await Promise.all(
    uniqueParticipantIds.map((userId) =>
      pusherServer.trigger(`user-${userId}`, 'conversation:new', serialized)
    )
  );

  return serialized;
};

type SendMessageInput = {
  conversationId: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  replyToId?: string;
};

export const sendMessage = async ({
  conversationId,
  senderId,
  content,
  imageUrl,
  videoUrl,
  audioUrl,
  replyToId
}: SendMessageInput) => {
  if (!content && !imageUrl && !videoUrl && !audioUrl) {
    throw new Error('訊息內容不得為空');
  }

  const targetConversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!targetConversation) {
    throw new Error('對話不存在');
  }

  const participantIds = targetConversation.participants.map(
    (participant) => participant.userId
  );

  if (!participantIds.includes(senderId)) {
    throw new Error('您沒有權限發送此對話的訊息');
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content ?? '',
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      audioUrl: audioUrl ?? null,
      replyToId: replyToId ?? null
    },
    include: messageInclude
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date()
    }
  });

  const serializedMessage = serializeMessage(message);
  const conversationUpdate = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude
  });

  if (conversationUpdate) {
    const serializedConversation = serializeConversation(conversationUpdate);
    await Promise.all([
      pusherServer.trigger(
        `conversation-${conversationId}`,
        'message:new',
        serializedMessage
      ),
      ...participantIds.map((userId) =>
        pusherServer.trigger(
          `user-${userId}`,
          'conversation:update',
          serializedConversation
        )
      )
    ]);
  }

  return serializedMessage;
};

export const listMessages = async (conversationId: string) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: {
      createdAt: 'asc'
    },
    include: messageInclude,
    take: 100
  });

  return messages.map(serializeMessage);
};

export const getConversationDetail = async (conversationId: string) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              uid: true,
              username: true,
              image: true,
              bio: true
            }
          }
        }
      }
    }
  });
};

