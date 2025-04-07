import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Simple in-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const suggestions = searchParams.get('suggestions') === 'true';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // For suggestions, return a simplified response
    if (suggestions) {
      return await getSuggestions(query);
    }

    // For full search, check cache first
    const cacheKey = `search:${query}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp) < CACHE_TTL) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Perform the full search
    const { db } = await connectToDatabase();
    
    // Use regex search for MongoDB
    const searchRegex = new RegExp(query, 'i');
    
    // Find products matching the query
    const products = await db.collection('product_reviews').find({
      $or: [
        { productName: searchRegex },
        { shortSummary: searchRegex },
        { category: searchRegex }
      ]
    })
    .limit(10)
    .toArray();
    
    // Find comparison reviews matching the query
    const reviews = await db.collection('comparison_reviews').find({
      $or: [
        { reviewTitle: searchRegex },
        { reviewSummary: searchRegex },
        { category: searchRegex }
      ]
    })
    .limit(5)
    .toArray();
    
    const responseData = { products, reviews };
    
    // Store in cache
    cache[cacheKey] = {
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

async function getSuggestions(query: string) {
  try {
    const { db } = await connectToDatabase();
    const searchRegex = new RegExp(`${query}`, 'i'); // Changed from ^${query} to match anywhere in the text
    
    // Get product name suggestions from product_reviews collection
    const productSuggestions = await db.collection('product_reviews')
      .find({ productName: searchRegex })
      .project({ productName: 1 })
      .limit(3)
      .toArray();
    
    // Get review title suggestions from comparison_reviews collection
    const reviewSuggestions = await db.collection('comparison_reviews')
      .find({ reviewTitle: searchRegex })
      .project({ reviewTitle: 1 })
      .limit(3)
      .toArray();
    
    // Format suggestions to match the expected interface
    const formattedSuggestions = [
      ...productSuggestions.map(p => ({ 
        text: p.productName, 
        type: 'PRODUCT' 
      })),
      ...reviewSuggestions.map(r => ({ 
        text: r.reviewTitle, 
        type: 'REVIEW' 
      }))
    ];
    
    return NextResponse.json({
      suggestions: formattedSuggestions
    });
  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}