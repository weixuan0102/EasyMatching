import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching users and hobbies...');
    const users = await prisma.user.findMany();
    const hobbies = await prisma.hobby.findMany();

    if (hobbies.length === 0) {
        console.log('No hobbies found. Please run the main seed script first.');
        return;
    }

    console.log(`Found ${users.length} users and ${hobbies.length} hobbies.`);

    for (const user of users) {
        // Skip if user already has hobbies
        const existingHobbies = await prisma.userHobby.count({
            where: { userId: user.id }
        });

        if (existingHobbies > 0) {
            console.log(`User ${user.username} already has hobbies. Skipping.`);
            continue;
        }

        // Pick 3-5 random hobbies
        const count = Math.floor(Math.random() * 3) + 3; // 3 to 5
        const shuffled = [...hobbies].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        console.log(`Assigning ${count} hobbies to ${user.username}...`);

        for (const hobby of selected) {
            await prisma.userHobby.create({
                data: {
                    userId: user.id,
                    hobbyId: hobby.id
                }
            });
        }
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
