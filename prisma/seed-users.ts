import { MongoClient } from 'mongodb';

const users = [
    {
        username: 'Alice',
        loginId: 'alice_user',
        email: 'alice@example.com',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        bio: 'Love hiking and coffee.',
        onboardingCompleted: true
    },
    {
        username: 'Bob',
        loginId: 'bob_user',
        email: 'bob@example.com',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        bio: 'Board games enthusiast.',
        onboardingCompleted: true
    },
    {
        username: 'Charlie',
        loginId: 'charlie_user',
        email: 'charlie@example.com',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        bio: 'Photographer and traveler.',
        onboardingCompleted: true
    },
    {
        username: 'Diana',
        loginId: 'diana_user',
        email: 'diana@example.com',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
        bio: 'Fitness addict.',
        onboardingCompleted: true
    },
    {
        username: 'Eve',
        loginId: 'eve_user',
        email: 'eve@example.com',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve',
        bio: 'Art lover.',
        onboardingCompleted: true
    }
];

async function main() {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        throw new Error('DATABASE_URL is not defined');
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const userCollection = db.collection('User');

        for (const user of users) {
            const existing = await userCollection.findOne({ email: user.email });
            if (!existing) {
                await userCollection.insertOne({
                    ...user,
                    uid: Math.random().toString(36).substring(7),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Created user: ${user.username}`);
            } else {
                console.log(`User already exists: ${user.username}`);
            }
        }
    } finally {
        await client.close();
    }
}

main().catch(console.error);
