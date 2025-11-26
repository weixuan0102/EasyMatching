import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError, z } from 'zod';

import { authOptions } from '@/lib/auth';
import { editMessage, deleteMessage } from '@/lib/conversation';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

const editMessageSchema = z.object({
    content: z.string().trim().min(1, '訊息內容不得為空')
});

type RouteContext = {
    params: Promise<{ conversationId: string; messageId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return unauthorized;
    }

    const { messageId } = await context.params;

    try {
        const json = await request.json();
        const payload = editMessageSchema.parse(json);

        const message = await editMessage({
            messageId,
            userId: session.user.id,
            content: payload.content
        });

        return NextResponse.json(message);
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: '資料驗證失敗', details: error.issues },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : '編輯訊息失敗' },
            { status: 400 }
        );
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return unauthorized;
    }

    const { messageId } = await context.params;

    try {
        const message = await deleteMessage({
            messageId,
            userId: session.user.id
        });

        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '刪除訊息失敗' },
            { status: 400 }
        );
    }
}
