import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Simple in-memory cache
const cache: Record<string, { data: Record<string, unknown>, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Change the type definition for the route handler
export async function GET(
  request: Request,
) {
  // Extract the ID from the URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  // Check cache first
  if (cache[id] && (Date.now() - cache[id].timestamp) < CACHE_TTL) {
    return NextResponse.json(cache[id].data);
  }

  try {
      // Fix: Add null check for the database connection
      const connection = await connectToDatabase();
    
      if (!connection || !connection.db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }
      
      const { db } = connection;
    
    // Use a more efficient aggregation pipeline to get review and products in one query
    const pipeline = [
      // Match the review by ID
      { $match: { _id: new ObjectId(id) } },
      // Lookup products in one operation
      {
        $lookup: {
          from: 'product_reviews',
          let: { productIds: '$products.productId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [{ $toString: '$_id' }, '$$productIds']
                }
              }
            },
            { $sort: { ranking: 1 } }
          ],
          as: 'productDetails'
        }
      }
    ];

    const results = await db.collection('comparison_reviews').aggregate(pipeline).toArray();
    
    if (!results.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = results[0];
    const products = review.productDetails || [];
    delete review.productDetails;

    const responseData = { review, products };
    
    // Store in cache
    cache[id] = {
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review data' }, { status: 500 });
  }
}