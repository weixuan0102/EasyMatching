import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError, z } from 'zod';

import { authOptions } from '@/lib/auth';
import {
  findConversationById,
  listMessages,
  sendMessage
} from '@/lib/conversation';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

const sendMessageSchema = z.object({
  content: z.string().trim().optional(),
  imageUrl: z.string().url().optional()
});

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  const { conversationId } = await context.params;

  const conversation = await findConversationById(
    conversationId,
    session.user.id
  );

  if (!conversation) {
    return NextResponse.json({ error: '對話不存在' }, { status: 404 });
  }

  const messages = await listMessages(conversationId);

  return NextResponse.json({ messages });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  const { conversationId } = await context.params;

  const conversation = await findConversationById(
    conversationId,
    session.user.id
  );

  if (!conversation) {
    return NextResponse.json({ error: '對話不存在' }, { status: 404 });
  }

  try {
    const json = await request.json();
    const payload = sendMessageSchema.parse(json);

    const message = await sendMessage({
      conversationId,
      senderId: session.user.id,
      content: payload.content,
      imageUrl: payload.imageUrl
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: '資料驗證失敗', details: error.issues },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '傳送訊息失敗' },
      { status: 400 }
    );
  }
}

