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
        // Check if user is in this conversation
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

        if (!existingParticipant.isActive) {
            return NextResponse.json(
                { error: '您已經解除配對' },
                { status: 400 }
            );
        }

        // Set isActive to false for this user's participation
        await prisma.conversationParticipant.update({
            where: {
                id: existingParticipant.id
            },
            data: {
                isActive: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unmatch error:', error);
        return NextResponse.json(
            { error: '解除配對失敗' },
            { status: 500 }
        );
    }
}
