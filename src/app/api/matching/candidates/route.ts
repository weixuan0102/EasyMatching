import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dayjs from 'dayjs';

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
        const start = dayjs().startOf('day').toDate();
        const end = dayjs().endOf('day').toDate();

        // Check daily limit
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
        const remainingSwipes = Math.max(0, DAILY_LIMIT - dailySwipeCount);

        if (remainingSwipes === 0) {
            return NextResponse.json({
                candidates: [],
                remainingSwipes: 0,
                limitReached: true
            });
        }

        // Get IDs of users already swiped
        const swipedUserIds = await prisma.swipe.findMany({
            where: {
                swiperId: userId
            },
            select: {
                targetId: true
            }
        });

        const excludedIds = [userId, ...swipedUserIds.map((s) => s.targetId)];

        // Fetch current user's hobbies
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
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
        });

        const myHobbies = new Set(currentUser?.hobbies.map((h) => h.hobby.name) || []);

        // Fetch candidates
        const candidates = await prisma.user.findMany({
            where: {
                id: {
                    notIn: excludedIds
                },
                onboardingCompleted: true // Only show completed profiles
            },
            take: 50, // Fetch a larger batch to sort effectively
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
        });

        // Transform data and calculate shared hobbies
        const formattedCandidates = candidates.map((user) => {
            const userHobbies = user.hobbies.map((h) => h.hobby.name);
            const sharedCount = userHobbies.filter((h) => myHobbies.has(h)).length;
            return {
                id: user.id,
                username: user.username,
                image: user.image,
                bio: user.bio,
                hobbies: userHobbies,
                sharedCount
            };
        });

        // Sort by shared count descending
        formattedCandidates.sort((a, b) => b.sharedCount - a.sharedCount);

        // Return top 20 after sorting
        const topCandidates = formattedCandidates.slice(0, 20);

        return NextResponse.json({
            candidates: topCandidates,
            remainingSwipes,
            limitReached: false
        });
    } catch (error: any) {
        console.error('Error in GET /api/matching/candidates:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
