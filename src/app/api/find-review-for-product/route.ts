import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    console.log("Finding review for product:", productId);
    
    // Get the product details first
    let product;
    if (ObjectId.isValid(productId)) {
      product = await db.collection('product_reviews').findOne({
        _id: new ObjectId(productId)
      });
    }
    
    if (!product) {
      console.log("Product not found with ID:", productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    console.log("Found product:", product.productName, "Category:", product.category);
    
    // Find a review in the same category
    const review = await db.collection('comparison_reviews').findOne({
      category: product.category
    });
    
    if (review) {
      console.log("Found review in category:", review.reviewTitle, "Slug:", review.slug);
      
      // Return the review slug or ID
      return NextResponse.json({ 
        reviewSlug: review.slug || review._id.toString(),
        reviewTitle: review.reviewTitle
      });
    } else {
      console.log("No review found for product category:", product.category);
      return NextResponse.json({ error: 'No review found for this product' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error finding review for product:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}