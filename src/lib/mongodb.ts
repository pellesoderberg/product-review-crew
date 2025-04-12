import { MongoClient, Db } from 'mongodb';

interface MongoConnection {
  client: MongoClient | null;
  db: Db | null;
}

// Extend the global type safely
declare global {
  // eslint-disable-next-line no-var
  var mongo: MongoConnection | undefined;
}

let cached = global.mongo;

if (!cached) {
  cached = { client: null, db: null };
  global.mongo = cached;
}

export async function connectToDatabase() {
  if (cached?.client && cached?.db) {
    return cached;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!process.env.MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  cached!.client = client;
  cached!.db = db;

  return cached!;
}
