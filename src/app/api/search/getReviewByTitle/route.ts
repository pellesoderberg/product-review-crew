import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Find the review with the exact title
    const review = await db.collection('comparison_reviews').findOne({
      reviewTitle: title
    });
    
    if (!review) {
      // If no exact match, redirect to search page
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(title)}`, request.url));
    }
    
    // Redirect to the review page
    return NextResponse.redirect(new URL(`/review/${review._id}`, request.url));
  } catch (error) {
    console.error('Error finding review by title:', error);
    // On error, redirect to search page
    const title = new URL(request.url).searchParams.get('title') || '';
    return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(title)}`, request.url));
  }
}