import { NextResponse } from 'next/server';

import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerAuthSession();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get IDs of users the current user has already swiped (to exclude them)
        const mySwipes = await prisma.swipe.findMany({
            where: {
                swiperId: session.user.id
            },
            select: {
                targetId: true
            }
        });

        const excludedIds = mySwipes.map((s) => s.targetId);

        const count = await prisma.swipe.count({
            where: {
                targetId: session.user.id,
                action: 'LIKE',
                swiperId: {
                    notIn: excludedIds
                }
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error('[LIKES_COUNT_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
