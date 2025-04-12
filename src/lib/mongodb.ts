import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || "";
const DATABASE_NAME = process.env.MONGODB_DB || "reviews";

// Cache the MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

if (!MONGO_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Set up connection options for better performance
  const options = {
    maxPoolSize: 10, // Increase connection pool size
    minPoolSize: 5,  // Maintain minimum connections
    connectTimeoutMS: 10000, // Connection timeout
    socketTimeoutMS: 45000, // Socket timeout
  };

  // Connect to cluster
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}