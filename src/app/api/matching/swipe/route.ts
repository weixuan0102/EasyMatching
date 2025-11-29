import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dayjs from 'dayjs';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConversation } from '@/lib/conversation';
import { pusherServer } from '@/lib/pusher-server';

const SWIPE_SCHEMA = z.object({
    targetId: z.string(),
    action: z.enum(['LIKE', 'PASS'])
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const result = SWIPE_SCHEMA.safeParse(body);

    if (!result.success) {
        return new NextResponse('Invalid request', { status: 400 });
    }

    const { targetId, action } = result.data;

    if (userId === targetId) {
        return new NextResponse('Cannot swipe yourself', { status: 400 });
    }

    // Check daily limit
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();

    const dailySwipeCount = await prisma.swipe.count({
        where: {
            swiperId: userId,
            createdAt: {
                gte: start,
                lte: end
            }
        }
    });

    const DAILY_LIMIT = 20;
    if (dailySwipeCount >= DAILY_LIMIT) {
        return NextResponse.json({ error: 'Daily limit reached' }, { status: 403 });
    }

    // Check if already swiped
    const existingSwipe = await prisma.swipe.findUnique({
        where: {
            swiperId_targetId: {
                swiperId: userId,
                targetId
            }
        }
    });

    if (existingSwipe) {
        return new NextResponse('Already swiped', { status: 400 });
    }

    // Record swipe
    await prisma.swipe.create({
        data: {
            swiperId: userId,
            targetId,
            action
        }
    });

    let isMatch = false;

    if (action === 'LIKE') {
        // Trigger Pusher event for real-time notification
        await pusherServer?.trigger(`user-${targetId}`, 'incoming-like', {
            swiperId: userId
        });

        // Check if target liked current user
        const targetSwipe = await prisma.swipe.findUnique({
            where: {
                swiperId_targetId: {
                    swiperId: targetId,
                    targetId: userId
                }
            }
        });

        if (targetSwipe?.action === 'LIKE') {
            isMatch = true;
            // Create conversation
            await createConversation({
                creatorId: userId,
                participantIds: [targetId],
                isGroup: false
            });
        }
    }

    return NextResponse.json({
        success: true,
        match: isMatch,
        remainingSwipes: Math.max(0, DAILY_LIMIT - dailySwipeCount - 1)
    });
}
