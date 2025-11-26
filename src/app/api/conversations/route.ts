import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError, z } from 'zod';

import { authOptions } from '@/lib/auth';
import { createConversation, listUserConversations } from '@/lib/conversation';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

const createConversationSchema = z.object({
  participantIds: z.array(z.string().trim()).min(1),
  isGroup: z.boolean().optional(),
  title: z.string().trim().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  const conversations = await listUserConversations(session.user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  try {
    const json = await request.json();
    const payload = createConversationSchema.parse(json);

    const conversation = await createConversation({
      creatorId: session.user.id,
      participantIds: payload.participantIds,
      isGroup: payload.isGroup,
      title: payload.title
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: '資料驗證失敗', details: error.issues },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '建立對話失敗' },
      { status: 400 }
    );
  }
}

