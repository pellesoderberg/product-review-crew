'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ComparisonReview } from '@/types';
import Loading from '@/components/Loading/Loading';
import styles from './category.module.css';

export default function CategoryPage({ params }: { params: { category: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ComparisonReview[]>([]);
  const category = decodeURIComponent(params.category);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`/api/category/${encodeURIComponent(category)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch category data');
        }
        
        const data = await response.json();
        setReviews(data.reviews);
      } catch (err) {
        console.error(err);
        setError('Failed to load category data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [category]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{category}</h1>
        <p className={styles.description}>
          Browse all product reviews in the {category} category
        </p>
      </header>

      {reviews.length > 0 ? (
        <div className={styles.reviewsGrid}>
          {reviews.map((review) => (
            <Link 
              href={`/review/${review._id}`} 
              key={review._id}
              className={styles.reviewCard}
            >
              <h2 className={styles.reviewTitle}>{review.reviewTitle}</h2>
              <p className={styles.reviewSummary}>{review.reviewSummary}</p>
              <div className={styles.meta}>
                <span className={styles.date}>
                  {new Date(review.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <p>No reviews found for the {category} category.</p>
          <Link href="/" className={styles.backLink}>
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}