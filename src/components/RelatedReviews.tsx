import Link from 'next/link';
import { connectToDatabase } from '@/lib/mongodb';
import styles from '../app/review/[id]/review.module.css';
import productStyles from '../app/product/product.module.css';

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
          OTHER REVIEWS IN CATEGORY:<br />
          {category.toUpperCase()}
        </h2>
        <ul className={styles.relatedReviewsList}>
          {relatedReviews.length > 0 ? (
            relatedReviews.map((relatedReview) => (
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
            latestReviews.map((latestReview) => (
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
async function getRelatedReviews(category: string, currentReviewId: string, limit = 3) {
  try {
    const { db } = await connectToDatabase();
    
    const relatedReviews = await db.collection('comparison_reviews')
      .find({ 
        category: category,
        _id: { $ne: currentReviewId }
      })
      .limit(limit)
      .toArray();
    
    return relatedReviews;
  } catch (error) {
    console.error('Error fetching related reviews:', error);
    return [];
  }
}

// Helper function to get latest reviews from different categories
async function getLatestReviews(excludeCategory: string, limit = 3) {
  try {
    const { db } = await connectToDatabase();
    
    const latestReviews = await db.collection('comparison_reviews')
      .find({ 
        category: { $ne: excludeCategory }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return latestReviews;
  } catch (error) {
    console.error('Error fetching latest reviews:', error);
    return [];
  }
}