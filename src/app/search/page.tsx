// src/app/search/page.tsx

import { connectToDatabase } from '@/lib/mongodb';
import Link from 'next/link';
import Image from 'next/image';
import styles from './search.module.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const { reviews, products } = await getSearchResults(query);
  const hasResults = reviews.length > 0 || products.length > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {query ? `Search Results for "${query}"` : 'All Reviews and Products'}
      </h1>

      {!hasResults && (
        <p className={styles.noResults}>
          No results found. Try a different search term.
        </p>
      )}

      {reviews.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Reviews</h2>
          <div className={styles.reviewsGrid}>
            {reviews.map((review) => (
              <Link
                href={`/review/${review.slug || review._id}`}
                key={review._id.toString()}
                className={styles.reviewCard}
              >
                <h3 className={styles.reviewTitle}>{review.reviewTitle}</h3>
                <p className={styles.reviewSummary}>
                  {review.reviewSummary
                    ? review.reviewSummary
                        .split(' ')
                        .slice(0, 20)
                        .join(' ') +
                      (review.reviewSummary.split(' ').length > 20
                        ? '...'
                        : '')
                    : 'No summary available'}
                </p>
                <span className={styles.viewReview}>View Review →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Products</h2>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <Link
                href={`/product/${product.slug || product._id}/${
                  product.award.replace(/\s+/g, '-').toLowerCase() .replace(/[^a-z0-9-]/g, '')    || 'details'
                }`}
                key={product._id.toString()}
                className={styles.productCard}
              >
                <div className={styles.productImageContainer}>
                  <Image
                    src="/placeholder.jpg"
                    alt={product.productName}
                    width={150}
                    height={150}
                    className={styles.productImage}
                  />
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.productName}</h3>
                  <p className={styles.productSummary}>
                    {product.shortSummary}
                  </p>
                  <span className={styles.viewProduct}>View Product →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function getSearchResults(query: string) {
  try {
    const { db } = await connectToDatabase();

    if (!db) throw new Error('Database connection failed');

    const searchRegex = query ? new RegExp(query, 'i') : undefined;

    const [reviews, products] = await Promise.all([
      db
        .collection('comparison_reviews')
        .find(searchRegex ? { reviewTitle: searchRegex } : {})
        .limit(query ? 10 : 20)
        .toArray(),
      db
        .collection('product_reviews')
        .find(searchRegex ? { productName: searchRegex } : {})
        .limit(query ? 10 : 20)
        .toArray(),
    ]);

    return { reviews, products };
  } catch (error) {
    console.error('Error searching:', error);
    return { reviews: [], products: [] };
  }
}
