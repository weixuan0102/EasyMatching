import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usersToFix = [
    { email: 'alice@example.com', loginId: 'alice_user' },
    { email: 'bob@example.com', loginId: 'bob_user' },
    { email: 'charlie@example.com', loginId: 'charlie_user' },
    { email: 'diana@example.com', loginId: 'diana_user' },
    { email: 'eve@example.com', loginId: 'eve_user' }
];

async function main() {
    console.log('Fixing loginIds...');

    for (const u of usersToFix) {
        const user = await prisma.user.findUnique({
            where: { email: u.email }
        });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { loginId: u.loginId }
            });
            console.log(`Updated ${user.username} with loginId: ${u.loginId}`);
        } else {
            console.log(`User with email ${u.email} not found.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
