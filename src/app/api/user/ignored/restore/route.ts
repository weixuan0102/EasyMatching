import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const RESTORE_SCHEMA = z.object({
    targetId: z.string()
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const result = RESTORE_SCHEMA.safeParse(body);

        if (!result.success) {
            return new NextResponse('Invalid request', { status: 400 });
        }

        const { targetId } = result.data;

        // 1. Delete Swipe record (if exists) - covers PASS and LIKE (from unmatch)
        await prisma.swipe.deleteMany({
            where: {
                swiperId: userId,
                targetId: targetId
            }
        });

        // 2. If it was an unmatch, we might want to ensure the conversation is fully reset or just rely on new match creation.
        // The conversation logic update handles re-activation.
        // But we should also check if there's an inactive participant record and maybe reset it or leave it?
        // If we delete the swipe, they can match again. When they match again, createConversation is called.
        // createConversation will find the existing conversation and re-activate it.
        // So deleting the swipe is sufficient to put them back in the pool.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[IGNORED_USER_RESTORE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
