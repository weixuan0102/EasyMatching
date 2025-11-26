import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

async function main() {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        throw new Error('DATABASE_URL is not defined');
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log('Listing collections:');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
        console.log(` - ${col.name}`);
        const count = await db.collection(col.name).countDocuments();
        console.log(`   Count: ${count}`);
    }

    await client.close();

    console.log('\nChecking via Prisma...');
    const prisma = new PrismaClient();
    try {
        const hobbies = await prisma.hobby.findMany();
        console.log(`Prisma found ${hobbies.length} hobbies.`);
        if (hobbies.length > 0) {
            console.log('First hobby:', hobbies[0]);
        }
    } catch (e) {
        console.error('Prisma error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
