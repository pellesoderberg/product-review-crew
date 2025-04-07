'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ComparisonReview, Product } from '@/types';
import Loading from '@/components/Loading/Loading';
import styles from './search.module.css';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ComparisonReview[]>([]);

  useEffect(() => {
    // If no query, redirect to home
    if (!query) {
      router.push('/');
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add a timestamp to prevent caching issues
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&t=${Date.now()}`);
        
        if (!response.ok) {
          console.error('Search API error:', await response.text());
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, router]);

  useEffect(() => {
    // Check if we should scroll to a product
    const scrollToProduct = searchParams.get('scrollToProduct') === 'true';
    const productQuery = searchParams.get('q');
    
    if (scrollToProduct && productQuery && products.length > 0) {
      // Find the product that best matches the query
      const matchingProduct = products.find(product => 
        product.productName.toLowerCase().includes(productQuery.toLowerCase())
      );
      
      if (matchingProduct) {
        // Find the product element and scroll to it
        const productElement = document.getElementById(`product-${matchingProduct._id}`);
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the element temporarily
          productElement.classList.add('highlight-product');
          setTimeout(() => {
            productElement.classList.remove('highlight-product');
          }, 2000);
        }
      }
    }
  }, [products, searchParams]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Search Results for "{query}"</h1>
      </header>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {!error && products.length === 0 && reviews.length === 0 && (
        <div className={styles.noResults}>
          <p>No results found for "{query}". Try a different search term.</p>
        </div>
      )}

      {reviews.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Comparison Reviews</h2>
          <div className={styles.reviewsGrid}>
            {reviews.map((review) => (
              <Link 
                href={`/review/${review._id}`} 
                key={review._id}
                className={styles.reviewCard}
              >
                <h3 className={styles.reviewTitle}>{review.reviewTitle}</h3>
                <p className={styles.reviewSummary}>{review.reviewSummary}</p>
                <div className={styles.meta}>
                  <span className={styles.category}>{review.category}</span>
                  <span className={styles.date}>
                    {new Date(review.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Products</h2>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div key={product._id} className={styles.productCard}>
                <h3 className={styles.productName}>{product.productName}</h3>
                {product.ranking && (
                  <div className={styles.ranking}>#{product.ranking}</div>
                )}
                <p className={styles.productSummary}>{product.shortSummary}</p>
                <div className={styles.meta}>
                  <span className={styles.price}>{product.priceRange}</span>
                  <span className={styles.category}>{product.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}