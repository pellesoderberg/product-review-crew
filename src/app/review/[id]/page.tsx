import Image from 'next/image';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import styles from './review.module.css';

// Define the params type
type ReviewPageParams = {
  params: {
    id: string;
  };
};

async function getReviewData(id: string) {
  const { db } = await connectToDatabase();
  
  try {
    // Convert string ID to MongoDB ObjectId
    const objectId = new ObjectId(id);
    
    // Fetch the review
    const review = await db.collection('comparison_reviews').findOne({ _id: objectId });
    
    if (!review) {
      return null;
    }
    
    // Fetch the products referenced in the review or directly from product_reviews
    let products = [];
    
    if (review.products && Array.isArray(review.products)) {
      const productIds = review.products.map((p: any) => new ObjectId(p.productId));
      products = await db.collection('product_reviews')
        .find({ _id: { $in: productIds } })
        .toArray();
    } else {
      // If no products array in review, try to find products by category
      products = await db.collection('product_reviews')
        .find({ category: review.category })
        .limit(3)
        .toArray();
    }
    
    // Sort products by ranking
    products.sort((a: any, b: any) => (a.ranking || 999) - (b.ranking || 999));
    
    return { review, products };
  } catch (error) {
    console.error('Error fetching review data:', error);
    return null;
  }
}

// Make sure to properly type the params and use async
// Update the params type to use Promise
type ReviewPageParams = {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
};

// Update the ReviewPage function to properly await params
export default async function ReviewPage({ params }: ReviewPageParams) {
  // Await params if it's a Promise
  const resolvedParams = 'then' in params ? await params : params;
  const id = resolvedParams?.id || '';
  const data = await getReviewData(id);
  
  if (!data) {
    return <div className={styles.container}>Review not found</div>;
  }
  
  // Rest of your component remains the same
  const { review, products } = data;
  
  // Define award types and colors for the top 3 products
  const awards = ["BEST OVERALL", "BEST AFFORDABLE", "BEST PREMIUM"];
  const bannerColors = ["#1e4620", "#1a1a4b", "#5c5c1e"];
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.reviewTitle}>{review.reviewTitle}</h1>
        <p className={styles.reviewSummary}>{review.reviewSummary}</p>
      </header>
      
      <section className={styles.productsGrid}>
        {products.slice(0, 3).map((product: any, index: number) => (
          <div key={product._id} className={styles.productCard}>
            <div 
              className={styles.awardBanner} 
              style={{ backgroundColor: bannerColors[index] }}
            >
              <span className={styles.number}>{index + 1}</span> 
              <span>{awards[index] || product.award || `BEST CHOICE`}</span>
            </div>
            <div className={styles.productImageContainer}>
              <Image 
                src={product.image} 
                alt={product.productName}
                width={200}
                height={200}
                unoptimized={true}
                className={styles.productImage}
              />
            </div>
            <div className={styles.price}>{product.priceRange}</div>
            <div className={styles.productSummary}>{product.shortSummary}</div>
            <a 
              href={product.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.buyButton}
              style={{ backgroundColor: bannerColors[index] }}
            >
              BUY NOW
            </a>
          </div>
        ))}
      </section>
      
      <section className={styles.detailedReview}>
        {products.map((product: any, index: number) => (
          <div key={product._id} className={styles.productDetail}>
            <h2 className={styles.productDetailTitle}>
              {index + 1}. {product.productName} - {product.award || awards[index] || "BEST CHOICE"}
            </h2>
            <div className={styles.productDetailContent}>
              <div className={styles.productDetailImage}>
                <Image 
                  src={product.image} 
                  alt={product.productName}
                  width={200}
                  height={200}
                  unoptimized={true}
                />
                <div className={styles.productDetailPrice}>{product.priceRange}</div>
                <a 
                  href={product.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.buyButton}
                  style={{ backgroundColor: bannerColors[index % 3] }}
                >
                  BUY NOW
                </a>
              </div>
              <div className={styles.productDetailText}>
                <div className={styles.productReviewText}>
                  <p>{product.review || product.shortSummary}</p>
                </div>
                
                {(product.pros?.length > 0 || product.cons?.length > 0) && (
                  <div className={styles.productFeatures}>
                    {product.pros && product.pros.length > 0 && (
                      <div className={styles.featureSection}>
                        <ul className={styles.prosList}>
                          {product.pros.map((pro: string, i: number) => (
                            <li key={i}>
                              <span className={`${styles.featureIcon} ${styles.proIcon}`}>+</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {product.cons && product.cons.length > 0 && (
                      <div className={styles.featureSection}>
                        <ul className={styles.consList}>
                          {product.cons.map((con: string, i: number) => (
                            <li key={i}>
                              <span className={`${styles.featureIcon} ${styles.conIcon}`}>−</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}