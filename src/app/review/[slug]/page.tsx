import Image from 'next/image';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import styles from './review.module.css';
import { redirect } from 'next/navigation';
import ProsConsBox from '@/app/components/ProsConsBox';

// Define proper types for the data structures
interface Product {
  _id: string | ObjectId;
  productName: string;
  image: string;
  priceRange?: string;
  price?: string;
  shortSummary?: string;
  link?: string;
  affiliateLink?: string;
  award?: string;
  ranking?: number;
  category?: string;
  pros?: string[];
  cons?: string[];
  review?: string;
  reviewText?: string;
}

interface Review {
  _id: string | ObjectId;
  slug?: string;
  reviewTitle: string;
  reviewSummary: string;
  category: string;
  comparisonReview?: string;
  products?: Array<{ productId: string }>;
  createdAt?: Date;
}

// Update the params type to be a Promise only
type ReviewPageParams = {
  params: Promise<{ slug: string }>
};

// Update the getReviewData function to better handle different ID formats
async function getReviewData(id: string) {
    // Add null check for the database connection
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return null;
    }
    
    const { db } = connection;
  
  try {
    let reviewDoc = null;
    
    // First, try to find by exact slug match
    reviewDoc = await db.collection('comparison_reviews').findOne({ slug: id });
    
    // If not found by slug, try to find by partial slug match
    if (!reviewDoc) {
      reviewDoc = await db.collection('comparison_reviews').findOne({
        slug: { $regex: new RegExp(id, 'i') }
      });
    }
    
    // If still not found and it's a valid ObjectId, try by ID
    if (!reviewDoc && ObjectId.isValid(id)) {
      const objectId = new ObjectId(id);
      reviewDoc = await db.collection('comparison_reviews').findOne({ _id: objectId });
      
      // If found by ID but has a slug, redirect to the slug URL for SEO
      if (reviewDoc && reviewDoc.slug) {
        return { redirect: `/review/${reviewDoc.slug}` };
      }
    }
    
    // If still not found, try to find by category
    if (!reviewDoc) {
      // Try to extract a category from the ID string
      const possibleCategory = id.replace(/^best-|-compared$/g, '').replace(/-/g, ' ');
      reviewDoc = await db.collection('comparison_reviews').findOne({
        category: { $regex: new RegExp(possibleCategory, 'i') }
      });
    }
    
    if (!reviewDoc) {
      return null;
    }
    
    // Convert MongoDB document to Review interface
    const review: Review = {
      _id: reviewDoc._id,
      slug: reviewDoc.slug,
      reviewTitle: reviewDoc.reviewTitle || 'Untitled Review',
      reviewSummary: reviewDoc.reviewSummary || 'No summary available',
      category: reviewDoc.category || 'Uncategorized',
      comparisonReview: reviewDoc.comparisonReview,
      products: reviewDoc.products,
      createdAt: reviewDoc.createdAt
    };
    
    // Fetch the products referenced in the review or directly from product_reviews
    let products: Product[] = [];
    
    if (review.products && Array.isArray(review.products)) {
      const productIds = review.products.map((p) => new ObjectId(p.productId));
      const productDocs = await db.collection('product_reviews')
        .find({ _id: { $in: productIds } })
        .toArray();
        
      // Map MongoDB documents to Product interface
      products = productDocs.map(doc => ({
        _id: doc._id,
        productName: doc.productName || 'Unknown Product',
        image: doc.image || '/placeholder.jpg',
        priceRange: doc.priceRange,
        price: doc.price,
        shortSummary: doc.shortSummary,
        link: doc.link,
        affiliateLink: doc.affiliateLink,
        award: doc.award,
        ranking: doc.ranking,
        category: doc.category,
        pros: doc.pros,
        cons: doc.cons,
        review: doc.review,
        reviewText: doc.reviewText
      }));
    } else {
      // If no products array in review, try to find products by category
      const productDocs = await db.collection('product_reviews')
        .find({ category: review.category })
        .limit(3)
        .toArray();
        
      // Map MongoDB documents to Product interface
      products = productDocs.map(doc => ({
        _id: doc._id,
        productName: doc.productName || 'Unknown Product',
        image: doc.image || '/placeholder.jpg',
        priceRange: doc.priceRange,
        price: doc.price,
        shortSummary: doc.shortSummary,
        link: doc.link,
        affiliateLink: doc.affiliateLink,
        award: doc.award,
        ranking: doc.ranking,
        category: doc.category,
        pros: doc.pros,
        cons: doc.cons,
        review: doc.review,
        reviewText: doc.reviewText
      }));
    }
    
    // Sort products by ranking
    products.sort((a: Product, b: Product) => (a.ranking || 999) - (b.ranking || 999));
    
    return { review, products };
  } catch (error) {
    console.error('Error fetching review data:', error);
    return null;
  }
}

// In the ReviewPage component, update the redirect check
// Update the function signature
export default async function ReviewPage({ params }: ReviewPageParams) {
  const resolvedParams = await params;
  const data = await getReviewData(resolvedParams.slug);
  
  // Handle redirects for SEO
  if (data && 'redirect' in data && typeof data.redirect === 'string') {
    redirect(data.redirect);
  }
  
  if (!data) {
    return <div className={styles.container}>Review not found</div>;
  }
  
  // Add a type guard to check if data has review and products properties
  if (!('review' in data)) {
    return <div className={styles.container}>Invalid review data</div>;
  }
  
  const { review, products } = data;
  
  // Fetch related reviews in the same category
  const relatedReviews = await getRelatedReviews(review.category, review._id.toString());
  
  // Fetch latest reviews from different categories
  const latestReviews = await getLatestReviews(review.category);
  
  // Define banner colors for the top 3 products
  const bannerColors = ["#1e4620", "#1a1a4b", "#5c5c1e"];
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.reviewTitle}>{review.reviewTitle}</h1>
        <p className={styles.reviewSummary}>{review.reviewSummary}</p>
      </header>
      
      <section className={styles.productsGrid}>
        {products.slice(0, 3).map((product: Product, index: number) => (
          <div key={product._id.toString()} className={styles.productCard}>
            <div 
              className={styles.awardBanner} 
              style={{ backgroundColor: bannerColors[index] }}
            >
              <span className={styles.number}>{index + 1}</span> 
              <span className={styles.awardText}>
                {product.award || (index === 0 ? "BEST OVERALL" : index === 1 ? "BEST AFFORDABLE" : "BEST PREMIUM")}
              </span>
            </div>
            <div className={styles.productImageContainer}>
              <Image 
                src={product.image} 
                alt={product.productName}
                width={200}
                height={200}
                unoptimized={true}
                className={styles.productImage}
              />
            </div>
            <div className={styles.price}>{product.priceRange}</div>
            <div className={styles.productSummary}>{product.shortSummary}</div>
            <a 
              href={product.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.buyButton}
              style={{ backgroundColor: bannerColors[index] }}
            >
              BUY NOW
            </a>
          </div>
        ))}
      </section>
      
      {/* Add comparison review section */}
      {review.comparisonReview && (
        <div className={styles.comparisonText}>
          <h2 className={styles.sectionTitle}>Product-review-crew&apos;s comparison</h2>
          {typeof review.comparisonReview === 'string' ? (
            <div dangerouslySetInnerHTML={{ 
              __html: formatReviewText(review.comparisonReview) 
            }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: review.comparisonReview }} />
          )}
        </div>
      )}
      
      <section className={styles.detailedReview}>
        {products.map((product: Product, index: number) => (
          <div 
            key={product._id.toString()} 
            className={styles.productDetail}
            id={`product-${product._id}`}
          >
            <h2 className={styles.productDetailTitle}>
              <span className={styles.productRank}>{index + 1}</span>
              {product.productName} - {product.award || (index === 0 ? "BEST OVERALL" : index === 1 ? "BEST AFFORDABLE" : "BEST PREMIUM")}
            </h2>
            <div className={styles.productDetailContent}>
              <div className={styles.productDetailImage}>
                <Image 
                  src={product.image} 
                  alt={product.productName}
                  width={200}
                  height={200}
                  unoptimized={true}
                />
                <div className={styles.productDetailPrice}>{product.priceRange || product.price || '$399'}</div>
                <a 
                  href={product.affiliateLink || product.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.buyButton}
                  style={{ backgroundColor: bannerColors[index % 3] }}
                >
                  BUY NOW
                </a>
              </div>
              
              {/* Product detail text section */}
              <div className={styles.productDetailText}>
                {/* Short summary with bold styling */}
                <div className={styles.productShortSummary}>
                  {product.shortSummary || 'No summary available for this product.'}
                </div>
                
                {/* Use the new ProsConsBox component */}
                <ProsConsBox pros={product.pros || []} cons={product.cons || []} />
                
                {/* Review content with normal styling */}
                <h3 className={styles.sectionTitle}></h3>
                <div className={styles.productReviewContent}>
                  <div 
                    className={styles.productReviewText} 
                    dangerouslySetInnerHTML={{ 
                      __html: formatProductReviewText(product.review || product.reviewText || '') 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
      
      {/* New section for related and latest reviews */}
      <div className={styles.relatedReviewsContainer}>
        <div className={styles.relatedReviewsSection}>
          <h2 className={styles.relatedReviewsTitle}>OTHER REVIEWS IN {review.category.toUpperCase()}</h2>
          <ul className={styles.relatedReviewsList}>
            {relatedReviews.length > 0 ? (
              relatedReviews.map((relatedReview) => (
                <li key={relatedReview._id.toString()} className={styles.relatedReviewItem}>
                  <Link href={`/review/${relatedReview.slug || relatedReview._id}`} className={styles.relatedReviewLink}>
                    {relatedReview.reviewTitle}
                  </Link>
                </li>
              ))
            ) : (
              <li className={styles.relatedReviewItem}>No other reviews in this category yet</li>
            )}
          </ul>
        </div>
        
        <div className={styles.latestReviewsSection}>
          <h2 className={styles.latestReviewsTitle}>LATEST REVIEWS</h2>
          <ul className={styles.latestReviewsList}>
            {latestReviews.length > 0 ? (
              latestReviews.map((latestReview) => (
                <li key={latestReview._id.toString()} className={styles.latestReviewItem}>
                  <Link href={`/review/${latestReview.slug || latestReview._id}`} className={styles.latestReviewLink}>
                    {latestReview.reviewTitle}
                  </Link>
                </li>
              ))
            ) : (
              <li className={styles.latestReviewItem}>No other reviews available yet</li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Remove the client-side script for scrolling */}
    </div>
  );
}

// Helper function to get related reviews in the same category
async function getRelatedReviews(category: string, currentReviewId: string, limit = 3): Promise<Review[]> {
  try {
    // Add null check for the database connection
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return []; // Return empty array instead of null
    }
    
    const { db } = connection;
    
    console.log(`Fetching related reviews for category: ${category}, excluding review: ${currentReviewId}`);
    
    const relatedReviewDocs = await db.collection('comparison_reviews')
      .find({ 
        category: category,
        _id: { $ne: new ObjectId(currentReviewId) }
      })
      .limit(limit)
      .toArray();
      
    console.log(`Found ${relatedReviewDocs.length} related reviews`);
    
    // Map MongoDB documents to Review interface
    const relatedReviews: Review[] = relatedReviewDocs.map(doc => ({
      _id: doc._id,
      slug: doc.slug,
      reviewTitle: doc.reviewTitle || 'Untitled Review',
      reviewSummary: doc.reviewSummary || 'No summary available',
      category: doc.category || 'Uncategorized',
      comparisonReview: doc.comparisonReview,
      products: doc.products,
      createdAt: doc.createdAt
    }));
    
    // Log the titles to debug
    relatedReviews.forEach((review, index) => {
      console.log(`Related review ${index + 1}: ${review.reviewTitle}`);
    });
    
    return relatedReviews;
  } catch (error) {
    console.error('Error fetching related reviews:', error);
    return [];
  }
}

// Helper function to get latest reviews from different categories
async function getLatestReviews(excludeCategory: string, limit = 3): Promise<Review[]> {
  try {
    // Add null check for the database connection
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return []; // Return empty array instead of null
    }
    
    const { db } = connection;
    
    console.log(`Fetching latest reviews excluding category: ${excludeCategory}`);
    
    const latestReviewDocs = await db.collection('comparison_reviews')
      .find({ 
        category: { $ne: excludeCategory }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
      
    console.log(`Found ${latestReviewDocs.length} latest reviews`);
    
    // Map MongoDB documents to Review interface
    const latestReviews: Review[] = latestReviewDocs.map(doc => ({
      _id: doc._id,
      slug: doc.slug,
      reviewTitle: doc.reviewTitle || 'Untitled Review',
      reviewSummary: doc.reviewSummary || 'No summary available',
      category: doc.category || 'Uncategorized',
      comparisonReview: doc.comparisonReview,
      products: doc.products,
      createdAt: doc.createdAt
    }));
    
    // Log the titles to debug
    latestReviews.forEach((review, index) => {
      console.log(`Latest review ${index + 1}: ${review.reviewTitle}`);
    });
    
    return latestReviews;
  } catch (error) {
    console.error('Error fetching latest reviews:', error);
    return [];
  }
}

// Helper function to format review text with exactly three paragraphs
function formatReviewText(text: string): string {
  // If text already has paragraph tags, return as is
  if (text.includes('<p>')) {
    return text;
  }
  
  // Remove any existing HTML tags for safety
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Split the text into roughly three equal parts
  const totalLength = cleanText.length;
  const partLength = Math.floor(totalLength / 3);
  
  // Find sentence boundaries near the split points
  let firstBreak = cleanText.indexOf('. ', partLength);
  if (firstBreak === -1) firstBreak = partLength;
  else firstBreak += 2; // Include the period and space
  
  let secondBreak = cleanText.indexOf('. ', partLength * 2);
  if (secondBreak === -1) secondBreak = partLength * 2;
  else secondBreak += 2; // Include the period and space
  
  // Create the three paragraphs
  const firstParagraph = cleanText.substring(0, firstBreak);
  const secondParagraph = cleanText.substring(firstBreak, secondBreak);
  const thirdParagraph = cleanText.substring(secondBreak);
  
  // Wrap in paragraph tags
  return `<p>${firstParagraph.trim()}</p><p>${secondParagraph.trim()}</p><p>${thirdParagraph.trim()}</p>`;
}

// Helper function to format product review text into two paragraphs
function formatProductReviewText(text: string): string {
  // If text already has paragraph tags, return as is
  if (text.includes('<p>')) {
    return text;
  }
  
  // Remove any existing HTML tags for safety
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Split the text into two roughly equal parts
  const totalLength = cleanText.length;
  const halfLength = Math.floor(totalLength / 2);
  
  // Find sentence boundary near the middle
  let breakPoint = cleanText.indexOf('. ', halfLength);
  if (breakPoint === -1) breakPoint = halfLength;
  else breakPoint += 2; // Include the period and space
  
  // Create the two paragraphs
  const firstParagraph = cleanText.substring(0, breakPoint);
  const secondParagraph = cleanText.substring(breakPoint);
  
  // Wrap in paragraph tags
  return `<p>${firstParagraph.trim()}</p><p>${secondParagraph.trim()}</p>`;
}

// Generate static pages for all reviews
export async function generateStaticParams() {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return [];
    }
    
    const { db } = connection;
    
    const reviews = await db.collection('comparison_reviews')
      .find({})
      .limit(20)
      .toArray();
    
    return reviews.map(review => ({
      slug: review.slug || review._id.toString()
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Update metadata function to use Promise type
export async function generateMetadata({ params }: ReviewPageParams) {
  const resolvedParams = await params;
  const data = await getReviewData(resolvedParams.slug); // Changed from id to slug

  if (!data || 'redirect' in data) {
    return {
      title: 'Review Not Found',
      description: 'The review you are looking for could not be found.',
    };
  }

  const { review } = data;

  return {
    title: review.reviewTitle || 'Product Comparison Review',
    description: review.reviewSummary || 'Detailed comparison of top products',
  };
}
