import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'digicare_bdip';

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

export async function getDb() {
  const client = await global._mongoClientPromise;
  return client.db(dbName);
}
