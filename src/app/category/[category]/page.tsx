import { connectToDatabase } from '@/lib/mongodb';
import styles from './category.module.css';
import Link from 'next/link';

// Define a Review interface
interface Review {
  _id: string;
  reviewTitle: string;
  updatedAt?: string | Date;
  createdAt?: string | Date;
  introduction?: string;
}

// Update the props type to match Next.js 15 requirements
export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>
}) {
  // Await the params to get the category
  const resolvedParams = await params;
  const category = resolvedParams.category;
  
  // Fetch category data
  const reviews = await fetchCategoryData(category);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{decodeURIComponent(category)} Reviews</h1>
      
      {reviews.length > 0 ? (
        <div className={styles.reviewGrid}>
          {reviews.map((review: Review) => (
            <Link href={`/review/${review._id}`} key={review._id} className={styles.reviewCard}>
              <h2 className={styles.reviewTitle}>{review.reviewTitle}</h2>
              <p className={styles.reviewDate}>
                {formatDate(review.updatedAt || review.createdAt)}
              </p>
              <p className={styles.reviewExcerpt}>
                {review.introduction ? `${review.introduction.substring(0, 150)}...` : 'No introduction available'}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.noResults}>No reviews found in this category.</p>
      )}
    </div>
  );
}

// Helper function to format dates safely
function formatDate(dateValue: string | Date | undefined): string {
  if (!dateValue) {
    return 'No date available';
  }
  
  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Helper function to fetch category data
async function fetchCategoryData(category: string): Promise<Review[]> {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return [];
    }
    
    const { db } = connection;
    
    const reviewDocs = await db.collection('comparison_reviews')
      .find({ category: { $regex: new RegExp(category, 'i') } })
      .toArray();
    
    // Properly map MongoDB documents to Review interface
    const reviews: Review[] = reviewDocs.map(doc => ({
      _id: doc._id.toString(),
      reviewTitle: doc.reviewTitle || 'Untitled Review',
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      introduction: doc.introduction
    }));
    
    return reviews;
  } catch (error) {
    console.error('Error fetching category data:', error);
    return [];
  }
}