// src/app/search/page.tsx

import { connectToDatabase } from '@/lib/mongodb';
import Link from 'next/link';
import Image from 'next/image';
import styles from './search.module.css';
import { Metadata } from 'next';
import { ObjectId } from 'mongodb';

export const metadata: Metadata = {
  title: 'Search Results',
};

// Add a proper interface for the review object
interface Review {
  _id: ObjectId;
  slug?: string;
  reviewTitle: string;
  reviewSummary?: string;
  category?: string;
  featuredImage?: string;
  products?: Array<{ productId: string }>;
}

interface ProductData {
  _id: ObjectId;
  slug?: string;
  productName: string;
  shortSummary?: string;
  image?: string;
  award?: string;
}

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
                {/* Add image container for review cards */}
                {review.featuredImage && (
                  <div className={styles.reviewImageContainer}>
                    <Image
                      src={review.featuredImage || "/placeholder.jpg"}
                      alt={review.reviewTitle}
                      width={150}
                      height={150}
                      className={styles.reviewImage}
                    />
                  </div>
                )}
                <div className={styles.reviewContent}>
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
                </div>
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
                  product.award 
                    ? product.award.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
                    : 'details'
                }`}
                key={product._id.toString()}
                className={styles.productCard}
              >
                <div className={styles.productImageContainer}>
                  <Image
                    src={product.image || "/placeholder.jpg"}
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

    // Get reviews with product information
    const reviews = await db
      .collection('comparison_reviews')
      .find(searchRegex ? { reviewTitle: searchRegex } : {})
      .limit(query ? 10 : 20)
      .toArray();
      
    // Fetch featured images for reviews
    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        let featuredImage = null;
        
        // If review has products array, get the first product's image
        if (review.products && Array.isArray(review.products) && review.products.length > 0) {
          const firstProductId = review.products[0].productId;
          const product = await db.collection('product_reviews').findOne(
            { _id: new ObjectId(firstProductId) },
            { projection: { image: 1 } }
          );
          
          if (product && product.image) {
            featuredImage = product.image;
          }
        } else {
          // If no products array, try to find a product in the same category
          const product = await db.collection('product_reviews')
            .findOne(
              { category: review.category },
              { projection: { image: 1 }, sort: { createdAt: -1 } }
            );
            
          if (product && product.image) {
            featuredImage = product.image;
          }
        }
        
        return {
          ...review,
          featuredImage
        };
      })
    );

    // Get products
    const products = await db
      .collection('product_reviews')
      .find(searchRegex ? { productName: searchRegex } : {})
      .limit(query ? 10 : 20)
      .toArray();

    return { 
      reviews: reviewsWithImages as Review[], 
      products: products as ProductData[] 
    };
  } catch (error) {
    console.error('Error searching:', error);
    return { reviews: [], products: [] };
  }
}
