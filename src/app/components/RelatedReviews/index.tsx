import Link from 'next/link';
import { connectToDatabase } from '@/lib/mongodb';
import styles from '@/app/review/[id]/review.module.css';
import productStyles from '@/app/product/product.module.css';
import { ObjectId, Filter, Document } from 'mongodb';

// Define the Review interface
interface Review {
  _id: string | ObjectId;
  slug?: string;
  reviewTitle: string;
  category: string;
}

interface RelatedReviewsProps {
  category: string;
  currentId?: string;
}

export default async function RelatedReviews({ category, currentId }: RelatedReviewsProps) {
  // Get related and latest reviews
  const relatedReviews = await getRelatedReviews(category, currentId || '', 3);
  const latestReviews = await getLatestReviews(category, 3);
  
  return (
    <div className={styles.relatedReviewsContainer}>
      <div className={styles.relatedReviewsSection}>
        <h2 className={styles.relatedReviewsTitle}>
          OTHER REVIEWS IN CATEGORY {category.toUpperCase()}
        </h2>
        <ul className={styles.relatedReviewsList}>
          {relatedReviews.length > 0 ? (
            relatedReviews.map((relatedReview: Review) => (
              <li key={relatedReview._id.toString()} className={styles.relatedReviewItem}>
                <Link href={`/review/${relatedReview.slug || relatedReview._id}`} className={`${styles.relatedReviewLink} ${productStyles.fullReviewLink}`}>
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
            latestReviews.map((latestReview: Review) => (
              <li key={latestReview._id.toString()} className={styles.latestReviewItem}>
                <Link href={`/review/${latestReview.slug || latestReview._id}`} className={`${styles.latestReviewLink} ${productStyles.fullReviewLink}`}>
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
  );
}

// Helper function to get related reviews in the same category
async function getRelatedReviews(category: string, currentReviewId: string, limit = 3): Promise<Review[]> {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return [];
    }
    
    const { db } = connection;
    
    // Create a query filter with proper typing
    const filter: Filter<Document> = { category: category };
    
    // Only add the _id filter if we have a valid ID
    if (currentReviewId && currentReviewId.trim() !== '') {
      // Check if it's a valid ObjectId
      if (ObjectId.isValid(currentReviewId)) {
        filter._id = { $ne: new ObjectId(currentReviewId) };
      } else {
        console.log('Invalid ObjectId format for currentReviewId:', currentReviewId);
      }
    }
    
    const relatedReviewDocs = await db.collection('comparison_reviews')
      .find(filter)
      .limit(limit)
      .toArray();
    
    // Map MongoDB documents to Review interface
    const relatedReviews: Review[] = relatedReviewDocs.map(doc => ({
      _id: doc._id,
      slug: doc.slug,
      reviewTitle: doc.reviewTitle || 'Untitled Review',
      category: doc.category || 'Uncategorized'
    }));
    
    return relatedReviews;
  } catch (error) {
    console.error('Error fetching related reviews:', error);
    return [];
  }
}

// Helper function to get latest reviews from different categories
async function getLatestReviews(excludeCategory: string, limit = 3): Promise<Review[]> {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return [];
    }
    
    const { db } = connection;
    
    const filter: Filter<Document> = { 
      category: { $ne: excludeCategory } 
    };
    
    const latestReviewDocs = await db.collection('comparison_reviews')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    // Map MongoDB documents to Review interface
    const latestReviews: Review[] = latestReviewDocs.map(doc => ({
      _id: doc._id,
      slug: doc.slug,
      reviewTitle: doc.reviewTitle || 'Untitled Review',
      category: doc.category || 'Uncategorized'
    }));
    
    return latestReviews;
  } catch (error) {
    console.error('Error fetching latest reviews:', error);
    return [];
  }
}