import { MongoClient } from 'mongodb';

const hobbies = [
  { name: '戶外健行', slug: 'outdoor-hiking' },
  { name: '獨立音樂', slug: 'indie-music' },
  { name: '桌遊聚會', slug: 'board-games' },
  { name: '影集追劇', slug: 'tv-series' },
  { name: '料理實驗', slug: 'cooking-lab' },
  { name: '攝影分享', slug: 'photography' },
  { name: '咖啡探索', slug: 'coffee-hunting' },
  { name: '動漫交流', slug: 'anime' },
  { name: '健身訓練', slug: 'fitness' },
  { name: '藝術展覽', slug: 'art-exhibitions' }
];

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // Uses the database from the connection string
    const collection = db.collection('Hobby');

    for (const hobby of hobbies) {
      const existing = await collection.findOne({ slug: hobby.slug });
      if (!existing) {
        await collection.insertOne({
          ...hobby,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created hobby: ${hobby.name}`);
      } else {
        console.log(`Hobby already exists: ${hobby.name}`);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
