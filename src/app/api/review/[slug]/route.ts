import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const cache: Record<string, { data: Record<string, unknown>, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const slug = decodeURIComponent(pathParts[pathParts.length - 1]);

  if (!slug) {
    return NextResponse.json({ error: 'Review slug is required' }, { status: 400 });
  }

  if (cache[slug] && (Date.now() - cache[slug].timestamp) < CACHE_TTL) {
    return NextResponse.json(cache[slug].data);
  }

  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { db } = connection;

    const pipeline = [
      { $match: { slug: slug } },
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
      // Try finding by ID if slug not found (for backward compatibility)
      if (ObjectId.isValid(slug)) {
        const idResults = await db.collection('comparison_reviews')
          .aggregate([
            { $match: { _id: new ObjectId(slug) } },
            ...pipeline.slice(1)
          ])
          .toArray();
        
        if (idResults.length) {
          const responseData = {
            review: idResults[0],
            products: idResults[0].productDetails || []
          };
          delete responseData.review.productDetails;
          
          cache[slug] = {
            data: responseData,
            timestamp: Date.now()
          };
          
          return NextResponse.json(responseData);
        }
      }
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = results[0];
    const products = review.productDetails || [];
    delete review.productDetails;

    const responseData = { review, products };
    
    cache[slug] = {
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review data' }, { status: 500 });
  }
}