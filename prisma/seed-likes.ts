import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find the target user (the one who will receive likes)
    // We assume it's the user who isn't one of our seed users
    const seedUsernames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

    const targetUser = await prisma.user.findFirst({
        where: {
            username: {
                notIn: seedUsernames
            }
        }
    });

    if (!targetUser) {
        console.error('No target user found. Please log in and create an account first.');
        return;
    }

    console.log(`Target user: ${targetUser.username} (${targetUser.id})`);

    // 2. Find seed users to be the "likers"
    const likers = await prisma.user.findMany({
        where: {
            username: {
                in: ['Alice', 'Bob', 'Charlie'] // Alice, Bob, Charlie will like the target
            }
        }
    });

    console.log(`Found ${likers.length} seed users to simulate likes.`);

    for (const liker of likers) {
        // Check if swipe already exists
        const existing = await prisma.swipe.findUnique({
            where: {
                swiperId_targetId: {
                    swiperId: liker.id,
                    targetId: targetUser.id
                }
            }
        });

        if (!existing) {
            await prisma.swipe.create({
                data: {
                    swiperId: liker.id,
                    targetId: targetUser.id,
                    action: 'LIKE'
                }
            });
            console.log(`${liker.username} liked ${targetUser.username}`);
        } else {
            console.log(`${liker.username} already swiped on ${targetUser.username}`);
        }
    }

    console.log('\n--- Login Credentials for Seed Users ---');
    console.log('You can log in as these users using the "User ID" login method:');
    console.log('Alice: alice_user');
    console.log('Bob:   bob_user');
    console.log('Charlie: charlie_user');
    console.log('Diana: diana_user');
    console.log('Eve:   eve_user');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
