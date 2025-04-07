'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ComparisonReview, Product } from '@/types';
import ProductCard from '@/components/ProductCard/ProductCard';
import styles from './review.module.css';
import { useParams } from 'next/navigation';

export default function ReviewPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ComparisonReview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Get the ID from params using useParams hook
  const reviewId = params.id as string;

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await fetch(`/api/review/${reviewId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch review data');
        }
        
        const data = await response.json();
        setReview(data.review);
        setProducts(data.products);
      } catch (err) {
        console.error(err);
        setError('Failed to load review. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) {
      fetchReviewData();
    }
  }, [reviewId]);

  if (loading) {
    return <div className={styles.loading}>Loading review...</div>;
  }

  if (error || !review) {
    return <div className={styles.error}>{error || 'Review not found'}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{review.reviewTitle}</h1>
        <p className={styles.summary}>{review.reviewSummary}</p>
        <div className={styles.meta}>
          <span className={styles.category}>{review.category}</span>
          <span className={styles.date}>
            Updated: {new Date(review.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      <section className={styles.productsGrid}>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} showDetails={true} />
        ))}
      </section>

      <section className={styles.fullReview}>
        <h2>Full Comparison Review</h2>
        <div className={styles.reviewContent}>
          {review.comparisonReview.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>
      
      <div className={styles.backLink}>
        <Link href="/">Back to Search</Link>
      </div>
    </div>
  );
}