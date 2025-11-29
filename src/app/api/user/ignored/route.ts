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

        // 1. Get users swiped as PASS
        const passedSwipes = await prisma.swipe.findMany({
            where: {
                swiperId: userId,
                action: 'PASS'
            },
            include: {
                target: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        bio: true
                    }
                }
            }
        });

        // 2. Get all mutual matches (My LIKE + Their LIKE)
        // This covers users I liked who also liked me
        const myLikes = await prisma.swipe.findMany({
            where: {
                swiperId: userId,
                action: 'LIKE'
            },
            include: {
                target: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        bio: true,
                        sentSwipes: {
                            where: {
                                targetId: userId,
                                action: 'LIKE'
                            },
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        // Filter to get only mutual matches
        const mutualMatches = myLikes.filter((swipe) => swipe.target.sentSwipes.length > 0);

        // 3. Get my conversations to check status
        const myConversations = await prisma.conversationParticipant.findMany({
            where: {
                userId: userId
            },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: {
                                userId: {
                                    not: userId
                                }
                            },
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        });

        // 4. Identify ignored matches (Unmatched or Deleted)
        // A match is ignored if:
        // - No conversation exists (Deleted)
        // - Conversation exists but I am inactive (Unmatched)
        const ignoredMatches = mutualMatches.filter((match) => {
            const targetId = match.target.id;

            // Find conversation with this user
            const conversation = myConversations.find((c) =>
                c.conversation.participants.some((p) => p.userId === targetId)
            );

            if (!conversation) {
                // No conversation found -> Deleted (Legacy or error)
                return true;
            }

            if ((conversation as any).isDeleted) {
                // Conversation soft deleted
                return true;
            }

            if (!conversation.isActive) {
                // Conversation exists but inactive -> Unmatched
                return true;
            }

            // Conversation exists and is active -> Not ignored
            return false;
        });

        const ignoredUsers = [
            ...passedSwipes.map((s) => ({ ...s.target, type: 'PASS' })),
            ...ignoredMatches.map((m) => ({ ...m.target, type: 'UNMATCH' }))
        ];

        // Remove duplicates
        const uniqueUsers = Array.from(
            new Map(ignoredUsers.map((u) => [u.id, u])).values()
        );

        return NextResponse.json({ users: uniqueUsers });
    } catch (error) {
        console.error('[IGNORED_USERS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
