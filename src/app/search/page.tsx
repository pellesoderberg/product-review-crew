import { connectToDatabase } from '@/lib/mongodb';
import Link from 'next/link';
import Image from 'next/image';
import styles from './search.module.css';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string } | Promise<{ q: string }>;
}) {
  // Await searchParams if it's a Promise
  const resolvedParams = 'then' in searchParams ? await searchParams : searchParams;
  const query = resolvedParams.q || '';
  
  // If no query, show empty search page
  if (!query) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Search Results</h1>
        <p className={styles.noResults}>Please enter a search term to find reviews and products.</p>
      </div>
    );
  }

  // Get search results
  const { reviews, products } = await getSearchResults(query);
  
  const hasResults = reviews.length > 0 || products.length > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search Results for "{query}"</h1>
      
      {!hasResults && (
        <p className={styles.noResults}>No results found for "{query}". Try a different search term.</p>
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
                  {/* Truncate the summary to 10 words */}
                  {review.reviewSummary 
                    ? review.reviewSummary.split(' ').slice(0, 20).join(' ') + (review.reviewSummary.split(' ').length > 10 ? '...' : '')
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
                href={`/product/${product.slug || product._id}/${product.award || 'details'}`} 
                key={product._id.toString()} 
                className={styles.productCard}
              >
                <div className={styles.productImageContainer}>
                  {product.image && (
                    <Image 
                      src={product.image} 
                      alt={product.productName}
                      width={150}
                      height={150}
                      className={styles.productImage}
                      unoptimized={true}
                    />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.productName}</h3>
                  <p className={styles.productSummary}>{product.shortSummary}</p>
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

// Function to get search results
async function getSearchResults(query: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Create a case-insensitive regex for the search
    const searchRegex = new RegExp(query, 'i');
    
    // Search for reviews - only match reviewTitle
    const reviews = await db.collection('comparison_reviews')
      .find({
        reviewTitle: searchRegex
      })
      .limit(10)
      .toArray();
    
    // Search for products - only match productName
    const products = await db.collection('product_reviews')
      .find({
        productName: searchRegex
      })
      .limit(10)
      .toArray();
    
    return { reviews, products };
  } catch (error) {
    console.error('Error searching:', error);
    return { reviews: [], products: [] };
  }
}