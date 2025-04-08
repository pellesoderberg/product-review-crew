import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  
  if (!productId) {
    return NextResponse.redirect(new URL('/search', request.url));
  }
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Find a review that contains this product in the comparison_reviews collection
    const review = await db.collection('comparison_reviews').findOne({
      products: { $elemMatch: { productId: productId } }
    });
    
    if (review) {
      console.log("Found review:", review._id, "Title:", review.reviewTitle, "Slug:", review.slug);
      
      // Check if the review has a slug field
      if (!review.slug && review.reviewTitle) {
        // Generate a slug from the review title if it doesn't exist
        const slug = review.reviewTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        // Update the review with the new slug
        await db.collection('comparison_reviews').updateOne(
          { _id: review._id },
          { $set: { slug: slug } }
        );
        
        console.log("Generated and saved slug:", slug);
        
        // Redirect to the review page with the new slug
        return NextResponse.redirect(new URL(`/review/${slug}#product-${productId}`, request.url));
      }
      
      // Use the slug for SEO-friendly URLs if available
      // Update the redirect path to use the id parameter name
      const reviewPath = review.slug 
        ? `/review/${review.slug}` 
        : `/review/${review._id}`;
        
      console.log("Redirecting to:", reviewPath);
      
      // Redirect to the review page with a hash fragment for the product
      return NextResponse.redirect(new URL(`${reviewPath}#product-${productId}`, request.url));
    } else {
      console.log("No review found for product:", productId);
      return NextResponse.redirect(new URL(`/search?q=${productId}`, request.url));
    }
  } catch (error) {
    console.error('Error redirecting to review:', error);
    return NextResponse.redirect(new URL('/search', request.url));
  }
}