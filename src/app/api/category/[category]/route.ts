import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request
) {
  // Extract the category from the URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const category = decodeURIComponent(pathParts[pathParts.length - 1]);

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  try {
    // Fix: Add null check for the database connection
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { db } = connection;
    
    // Find all comparison reviews in the specified category
    const reviews = await db.collection('comparison_reviews')
      .find({ category: { $regex: new RegExp(category, 'i') } })
      .toArray();
    
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch category data' }, { status: 500 });
  }
}