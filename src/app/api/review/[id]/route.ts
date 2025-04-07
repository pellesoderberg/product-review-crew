import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Simple in-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Await params before accessing its properties
  const id = (await params).id;

  if (!id) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  // Check cache first
  if (cache[id] && (Date.now() - cache[id].timestamp) < CACHE_TTL) {
    return NextResponse.json(cache[id].data);
  }

  try {
    const { db } = await connectToDatabase();
    
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
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}