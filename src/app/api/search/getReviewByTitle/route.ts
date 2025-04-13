import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 });
    }

    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { db } = connection;

    const review = await db.collection('comparison_reviews').findOne({
      reviewTitle: title
    });
    
    if (!review) {
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(title)}`, request.url));
    }
    
    return NextResponse.redirect(new URL(`/review/${review.slug}`, request.url));
  } catch (error) {
    console.error('Error finding review by title:', error);
    const title = new URL(request.url).searchParams.get('title') || '';
    return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(title)}`, request.url));
  }
}