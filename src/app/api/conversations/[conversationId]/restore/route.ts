import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

type RouteContext = {
    params: Promise<{ conversationId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return unauthorized;
    }

    const { conversationId } = await context.params;

    try {
        // Check if user was in this conversation
        const existingParticipant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: session.user.id
            }
        });

        if (!existingParticipant) {
            return NextResponse.json(
                { error: '您不在此對話中' },
                { status: 400 }
            );
        }

        if (existingParticipant.isActive) {
            return NextResponse.json(
                { error: '對話已經是啟用狀態' },
                { status: 400 }
            );
        }

        // Restore the conversation by setting isActive to true
        await prisma.conversationParticipant.update({
            where: {
                id: existingParticipant.id
            },
            data: {
                isActive: true
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Restore conversation error:', error);
        return NextResponse.json(
            { error: '恢復配對失敗' },
            { status: 500 }
        );
    }
}
