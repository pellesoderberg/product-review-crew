import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  
  if (!productId) {
    console.log("No productId provided");
    return NextResponse.redirect(new URL('/search', request.url));
  }
  
  try {
    // Redirect to the product page instead of the review page
    return NextResponse.redirect(new URL(`/product/${productId}`, request.url));
  } catch (error) {
    console.error('Error redirecting to product:', error);
    return NextResponse.redirect(new URL('/search', request.url));
  }
}

try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    console.log("Looking for review containing product:", productId);
    
    // Get the product details first
    let product;
    if (ObjectId.isValid(productId)) {
      product = await db.collection('product_reviews').findOne({
        _id: new ObjectId(productId)
      });
      console.log("Looking up product by ObjectId:", productId);
    }
    
    if (!product) {
      console.log("Product not found with ID:", productId);
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(productId)}`, request.url));
    }
    
    console.log("Found product:", product.productName, "Category:", product.category);
    
    // Find a review in the same category
    const review = await db.collection('comparison_reviews').findOne({
      category: product.category
    });
    
    if (review) {
      console.log("Found review in category:", review.reviewTitle, "Slug:", review.slug);
      
      // Use the slug for SEO-friendly URLs if available
      const reviewPath = review.slug 
        ? `/review/${review.slug}` 
        : `/review/${review._id}`;
        
      // Fix: Remove the space between hash and productId
      console.log("Redirecting to:", reviewPath, "with hash #product-" + productId);
      
      // Fix: Ensure there's no space in the URL hash
      return NextResponse.redirect(new URL(`${reviewPath}#product-${productId.trim()}`, request.url));
    } else {
      console.log("No review found for product category:", product.category);
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(product.productName)}`, request.url));
    }
  } catch (error) {
    console.error('Error redirecting to review:', error);
    return NextResponse.redirect(new URL('/search', request.url));
  }
}