import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Finding a user...');
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found');
        return;
    }
    console.log(`Testing with user: ${user.username} (${user.id})`);

    const userId = user.id;
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();

    console.log('Checking daily limit...');
    const dailySwipeCount = await prisma.swipe.count({
        where: {
            swiperId: userId,
            createdAt: {
                gte: start,
                lte: end
            }
        }
    });
    console.log(`Daily swipe count: ${dailySwipeCount}`);

    console.log('Fetching swiped user IDs...');
    const swipedUserIds = await prisma.swipe.findMany({
        where: {
            swiperId: userId
        },
        select: {
            targetId: true
        }
    });
    console.log(`Swiped users count: ${swipedUserIds.length}`);

    const excludedIds = [userId, ...swipedUserIds.map((s) => s.targetId)];

    console.log('Fetching candidates...');
    const candidates = await prisma.user.findMany({
        where: {
            id: {
                notIn: excludedIds
            },
            onboardingCompleted: true
        },
        take: 20,
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
    console.log(`Candidates found: ${candidates.length}`);
    if (candidates.length > 0) {
        console.log('First candidate:', candidates[0]);
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
