import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;

        // Get IDs of users the current user has already swiped (to exclude them)
        const mySwipes = await prisma.swipe.findMany({
            where: {
                swiperId: userId
            },
            select: {
                targetId: true
            }
        });

        const excludedIds = mySwipes.map((s) => s.targetId);

        // Find swipes WHERE targetId = me AND action = LIKE AND swiperId NOT IN excludedIds
        const likes = await prisma.swipe.findMany({
            where: {
                targetId: userId,
                action: 'LIKE',
                swiperId: {
                    notIn: excludedIds
                }
            },
            include: {
                swiper: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        bio: true,
                        hobbies: {
                            select: {
                                hobby: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const formattedLikes = likes.map((swipe) => ({
            id: swipe.swiper.id,
            username: swipe.swiper.username,
            image: swipe.swiper.image,
            bio: swipe.swiper.bio,
            hobbies: swipe.swiper.hobbies.map((h) => h.hobby.name),
            likedAt: swipe.createdAt
        }));

        return NextResponse.json({ likes: formattedLikes });
    } catch (error: any) {
        console.error('Error in GET /api/matching/likes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
