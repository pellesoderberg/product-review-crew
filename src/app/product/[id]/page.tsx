import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import styles from 'product.module.css';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Product not found</h1>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/search" >
          <button className={styles.backButton}>Back to Search</button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.productTitle}>
        {product.rank}. {product.productName} - {product.subtitle || 'Product Details'}
      </h1>
      
      <div className={styles.productContent}>
        <div className={styles.productImageContainer}>
          <img 
            src={product.image} 
            alt={product.productName} 
            className={styles.productImage}
          />
          <div className={styles.priceContainer}>
            <span className={styles.price}>${product.price || '399'}</span>
            <a href={product.affiliateLink || '#'} target="_blank" rel="noopener noreferrer" className={styles.buyButton}>
              BUY NOW
            </a>
          </div>
        </div>
        
        <div className={styles.productDescription}>
          <p>{product.fullReview || product.description || 'No detailed description available for this product.'}</p>
          
          <div className={styles.additionalInfo}>
            <p>The precise airflow and temperature control make it suitable for all hair types, though those with very thick hair might want additional attachments. Maintenance is minimal thanks to the filter-free design, though the motor requires careful handling. For those willing to invest in a long-term hair care solution, the {product.productName} justifies its premium with unmatched performance and durability.</p>
          </div>
          
          <div className={styles.relatedReviews}>
            <h3>See this product in comparison reviews:</h3>
            <Link href={`/review/${product.reviewId || product.category}#product-${product._id}`}>
              <button className={styles.viewReviewButton}>View in Full Comparison</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getProduct(id: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Try to convert to ObjectId for MongoDB lookup
    let query = {};
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      // If not a valid ObjectId, try looking up by string ID
      query = { _id: id };
    }
    
    const product = await db.collection('product_reviews').findOne(query);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}