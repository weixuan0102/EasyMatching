import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

type RouteContext = {
    params: Promise<{ conversationId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return unauthorized;
    }

    const { conversationId } = await context.params;

    try {
        // Soft delete the user's participation in this conversation
        const result = await prisma.conversationParticipant.updateMany({
            where: {
                conversationId,
                userId: session.user.id
            },
            data: {
                isDeleted: true
            } as any
        });

        if (result.count === 0) {
            return NextResponse.json(
                { error: '您不在此對話中' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json(
            { error: '刪除對話失敗' },
            { status: 500 }
        );
    }
}
