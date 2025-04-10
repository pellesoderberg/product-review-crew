import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Simple in-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const suggestions = searchParams.get('suggestions') === 'true';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // For suggestions, return a simplified response
    if (suggestions) {
      return await getSuggestions(query);
    }

    // For full search
    const { db } = await connectToDatabase();
    
    // Search for products
    const productResults = await db.collection('product_reviews')
      .find({
        $or: [
          { productName: { $regex: query, $options: 'i' } }        ]
      })
      .limit(5)
      .toArray();
    
    // Add type field to product results
    const productsWithType = productResults.map(product => ({
      ...product,
      type: 'product'  // Make sure this is set correctly
    }));
    
    // Search for reviews
    const reviewResults = await db.collection('comparison_reviews')
      .find({
        $or: [
          { reviewTitle: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(5)
      .toArray();
    
    // Add type field to review results
    const reviewsWithType = reviewResults.map(review => ({
      ...review,
      type: 'review'
    }));
    
    return NextResponse.json({ results: [...productsWithType, ...reviewsWithType] });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}

async function getSuggestions(query: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Get product suggestions
    const productResults = await db.collection('product_reviews')
      .find({ 
        productName: { $regex: query, $options: 'i' } 
      })
      .limit(3)
      .toArray();
    
    // Get review suggestions
    const reviewResults = await db.collection('comparison_reviews')
      .find({ 
        reviewTitle: { $regex: query, $options: 'i' } 
      })
      .limit(3)
      .toArray();
    
    // Format with type field - ensure 'product' is lowercase to match the check in SearchSuggestions
    const productsWithType = productResults.map(product => ({
      ...product,
      type: 'product'
    }));
    
    const reviewsWithType = reviewResults.map(review => ({
      ...review,
      type: 'review'
    }));
    
    return NextResponse.json({ 
      results: [...productsWithType, ...reviewsWithType] 
    });
  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json({ results: [] });
  }
}