import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import styles from '../product.module.css';
import RelatedReviews from '@/app/components/RelatedReviews';
import ProsConsBox from '@/app/components/ProsConsBox';

// Add this function to get the review slug for a product
async function getReviewSlugForProduct(product: any) {
  try {
    const { db } = await connectToDatabase();
    
    // First try to find a review that explicitly includes this product
    let review = null;
    
    if (product._id) {
      // Look for reviews that include this product ID in their products array
      review = await db.collection('comparison_reviews').findOne({
        'products.productId': product._id.toString()
      });
    }
    
    // If not found, try to find by category
    if (!review && product.category) {
      review = await db.collection('comparison_reviews').findOne({
        category: product.category
      });
    }
    
    // If we found a review, return its slug or ID
    if (review) {
      return review.slug || review._id.toString();
    }
    
    // Fallback to a constructed slug if no review found
    return `best-${(product.category || 'products').toLowerCase().replace(/\s+/g, '-')}-compared`;
  } catch (error) {
    console.error('Error getting review slug for product:', error);
    return 'not-found';
  }
}

// Add generateStaticParams function for static site generation
export async function generateStaticParams() {
  const { db } = await connectToDatabase();
  
  // Get all products that have slugs
  const products = await db.collection('product_reviews')
    .find({ slug: { $exists: true } })
    .project({ slug: 1 })
    .toArray();
  
  // Return an array of slug params
  return products.map((product) => ({
    slug: [product.slug],
  }));
}

// Add metadata export for better SEO
// Fix the metadata function to properly await params
export async function generateMetadata({ params }: { params: { slug: string[] } | Promise<{ slug: string[] }> }) {
  // Await params if it's a Promise
  const resolvedParams = 'then' in params ? await params : params;
  const productSlug = resolvedParams.slug[0];
  const product = await getProductBySlug(productSlug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.',
    };
  }
  
  return {
    title: `${product.productName} ${product.award ? `- ${product.award}` : ''}`,
    description: product.shortSummary || `Detailed review of ${product.productName}`,
    openGraph: {
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string[] } }) {
  // Make sure params is properly awaited
  const resolvedParams = await Promise.resolve(params);
  
  // Extract the product slug from the URL
  const slugArray = resolvedParams.slug;
  const productSlug = slugArray[0]; // First part is the product slug
  
  // Get product by slug instead of ID
  const product = await getProductBySlug(productSlug);
  
  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Product not found</h1>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/search">
          <button className={styles.backButton}>Back to Search</button>
        </Link>
      </div>
    );
  }

  // Generate SEO-friendly URL with award
  const award = product.award || product.subtitle || 'details';
  const seoAward = award.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Get the review slug for this product
  const reviewSlug = await getReviewSlugForProduct(product);

  return (
    <div className={styles.container}>
      <h1 className={styles.productTitle}>
        {product.productName} {product.award ? `- ${product.award}` : ''}
      </h1>
      
      <div className={styles.productContent}>
        <div className={styles.productImageContainer}>
          <img 
            src={product.image} 
            alt={product.productName} 
            className={styles.productImage}
          />
          <div className={styles.priceContainer}>
            <span className={styles.price}>{product.priceRange || product.price || '100€'}</span>
            <a href={product.affiliateLink || product.link || '#'} target="_blank" rel="noopener noreferrer" className={styles.buyButton}>
              BUY NOW
            </a>
          </div>
        </div>
        
        <div className={styles.productDescription}>
          <div className={styles.shortSummary}>
            <p>{product.shortSummary || 'No summary available for this product.'}</p>
          </div>
          
          {/* Replace the existing pros/cons container with ProsConsBox */}
          <ProsConsBox pros={product.pros || []} cons={product.cons || []} />
          
          <div className={styles.compareSection}>            <Link 
              href={`/review/${reviewSlug}`} 
              className={styles.fullReviewLink}>
              See this product compared to similar products
            </Link>
          </div>
          
          <div className={styles.reviewSection}>
            {product.review ? (
              <>
                {formatReviewIntoParagraphs(product.review)}
              </>
            ) : (
              <p>{product.fullReview || 'No detailed review available for this product.'}</p>
            )}
          </div>
          
          {/* Add the related reviews component */}
          {product.category && (
            <RelatedReviews category={product.category} />
          )}
        </div>
      </div>
    </div>
  );
}

// Add a new function to get product by slug
async function getProductBySlug(slug: string) {
  try {
    const { db } = await connectToDatabase();
    
    // First try to find by exact slug match
    let product = await db.collection('product_reviews').findOne({ 
      slug: slug 
    });
    
    // If not found, try a more flexible search
    if (!product) {
      // Create a regex pattern for the product name in the slug
      const productNamePattern = slug.replace(/-/g, '.*');
      product = await db.collection('product_reviews').findOne({
        productName: { $regex: new RegExp(productNamePattern, 'i') }
      });
    }
    
    return product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

// Keep the original getProduct function for backward compatibility
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

// Helper function to format review text into paragraphs
function formatReviewIntoParagraphs(reviewText: string) {
  // Find a natural breaking point after a completed sentence, roughly in the middle
  const sentences = reviewText.match(/[^.!?]+[.!?]+\s*/g) || [];
  
  if (sentences.length <= 1) {
    return <p>{reviewText}</p>;
  }
  
  // Find a good breaking point around the middle of the text
  const midPoint = Math.ceil(sentences.length / 2);
  
  // Join sentences for each paragraph
  const firstParagraph = sentences.slice(0, midPoint).join('').trim();
  const secondParagraph = sentences.slice(midPoint).join('').trim();
  
  return (
    <>
      <p className={styles.reviewParagraph}>{firstParagraph}</p>
      <p className={styles.reviewParagraph}>{secondParagraph}</p>
    </>
  );
}

// Remove these lines that are causing the error:
// // Replace your current pros/cons section with:
// {/* Replace your current pros/cons section with the ProsConsBox component */}
// <ProsConsBox pros={productData.pros || []} cons={productData.cons || []} />