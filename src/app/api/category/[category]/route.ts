import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  const category = decodeURIComponent(params.category);

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
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