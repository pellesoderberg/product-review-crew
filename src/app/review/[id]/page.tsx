import Image from 'next/image';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import styles from './review.module.css';
import { redirect } from 'next/navigation';

// Define the params type
type ReviewPageParams = {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
};

async function getReviewData(id: string) {
  const { db } = await connectToDatabase();
  
  try {
    let review;
    
    // First, try to find by slug
    review = await db.collection('comparison_reviews').findOne({ slug: id });
    
    // If not found by slug, try to find by ObjectId
    if (!review && ObjectId.isValid(id)) {
      const objectId = new ObjectId(id);
      review = await db.collection('comparison_reviews').findOne({ _id: objectId });
      
      // If found by ID but has a slug, redirect to the slug URL for SEO
      if (review && review.slug) {
        return { redirect: `/review/${review.slug}` };
      }
    }
    
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

export default async function ReviewPage({ params }: ReviewPageParams) {
  // Await params if it's a Promise
  const resolvedParams = 'then' in params ? await params : params;
  const id = resolvedParams?.id || '';
  const data = await getReviewData(id);
  
  // Handle redirects for SEO
  if (data && 'redirect' in data) {
    redirect(data.redirect);
  }
  
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
      
      {/* Add comparison review section */}
      {review.comparisonReview && (
        <div className={styles.comparisonText}>
          <h2 className={styles.sectionTitle}>REVIEW</h2>
          {typeof review.comparisonReview === 'string' ? (
            <div dangerouslySetInnerHTML={{ 
              __html: formatReviewText(review.comparisonReview) 
            }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: review.comparisonReview }} />
          )}
        </div>
      )}
      
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
                  {typeof product.review === 'string' ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: formatProductReviewText(product.review || product.shortSummary) 
                    }} />
                  ) : (
                    <p>{product.review || product.shortSummary}</p>
                  )}
                </div>
                
                {/* Pros and cons box removed */}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// Helper function to format review text with exactly three paragraphs
function formatReviewText(text: string): string {
  // If text already has paragraph tags, return as is
  if (text.includes('<p>')) {
    return text;
  }
  
  // Remove any existing HTML tags for safety
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Split the text into roughly three equal parts
  const totalLength = cleanText.length;
  const partLength = Math.floor(totalLength / 3);
  
  // Find sentence boundaries near the split points
  let firstBreak = cleanText.indexOf('. ', partLength);
  if (firstBreak === -1) firstBreak = partLength;
  else firstBreak += 2; // Include the period and space
  
  let secondBreak = cleanText.indexOf('. ', partLength * 2);
  if (secondBreak === -1) secondBreak = partLength * 2;
  else secondBreak += 2; // Include the period and space
  
  // Create the three paragraphs
  const firstParagraph = cleanText.substring(0, firstBreak);
  const secondParagraph = cleanText.substring(firstBreak, secondBreak);
  const thirdParagraph = cleanText.substring(secondBreak);
  
  // Wrap in paragraph tags
  return `<p>${firstParagraph.trim()}</p><p>${secondParagraph.trim()}</p><p>${thirdParagraph.trim()}</p>`;
}

// Helper function to format product review text into two paragraphs
function formatProductReviewText(text: string): string {
  // If text already has paragraph tags, return as is
  if (text.includes('<p>')) {
    return text;
  }
  
  // Remove any existing HTML tags for safety
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Split the text into two roughly equal parts
  const totalLength = cleanText.length;
  const halfLength = Math.floor(totalLength / 2);
  
  // Find sentence boundary near the middle
  let breakPoint = cleanText.indexOf('. ', halfLength);
  if (breakPoint === -1) breakPoint = halfLength;
  else breakPoint += 2; // Include the period and space
  
  // Create the two paragraphs
  const firstParagraph = cleanText.substring(0, breakPoint);
  const secondParagraph = cleanText.substring(breakPoint);
  
  // Wrap in paragraph tags
  return `<p>${firstParagraph.trim()}</p><p>${secondParagraph.trim()}</p>`;
}