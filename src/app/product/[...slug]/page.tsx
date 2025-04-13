import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../product.module.css';
import RelatedReviews from '@/app/components/RelatedReviews';
import ProsConsBox from '@/app/components/ProsConsBox';

// Define a proper type instead of using 'any'
interface ProductData {
  _id: string | ObjectId;
  productName: string;
  slug?: string;
  category?: string;
  award?: string;
  subtitle?: string;
  image?: string;
  price?: string;
  priceRange?: string;
  affiliateLink?: string;
  link?: string;
  shortSummary?: string;
  pros?: string[];
  cons?: string[];
  review?: string;
  fullReview?: string;
}

// Add this function to get the review slug for a product
async function getReviewSlugForProduct(product: ProductData) {
  try {
    // Add null check for the database connection
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return null;
    }
    
    const { db } = connection;
    
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
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return []; // Return empty array instead of null
    }
    
    const { db } = connection;
    
    const products = await db.collection('product_reviews')
      .find({})
      .limit(20) // Limit to a reasonable number for static generation
      .toArray();
    
    // Format the params correctly
    return products.map(product => ({
      slug: [
        product.slug || product._id.toString(),
        (product.award || 'best-choice').toLowerCase().replace(/\s+/g, '-')
      ]
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return []; // Return empty array instead of null
  }
}

// Add metadata export for better SEO with Promise type
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string[] }> 
}) {
  // Await params to get the slug
  const resolvedParams = await params;
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

// Update the page component to handle Promise-based params
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string[] }> 
}) {
  // Make sure params is properly awaited
  const resolvedParams = await params;
  
  // Extract the product slug from the URL
  const slugArray = resolvedParams.slug;
  const productSlug = slugArray[0]; // First part is the product slug
  
  // Get product by slug instead of ID
  const product = await getProductBySlug(productSlug);
  
  if (!product) {
    return (
      <div className={styles.container}>
        <h1>Product not found</h1>
        <p>The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/search">
          <button className={styles.backButton}>Back to Search</button>
        </Link>
      </div>
    );
  }

  // Generate SEO-friendly URL with award
  //const award = product.award || product.subtitle || 'details';
  // Remove unused variable or use it somewhere
  // const seoAward = award.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Get the review slug for this product
  const reviewSlug = await getReviewSlugForProduct(product);

  return (
    <div className={styles.container}>
      <h1 className={styles.productTitle}>
        {product.productName} {product.award ? `- ${product.award}` : ''}
      </h1>
      
      <div className={styles.productContent}>
        <div className={styles.productImageContainer}>
          <Image 
            src={product.image || '/placeholder.jpg'} 
            alt={product.productName} 
            className={styles.productImage}
            width={500}
            height={500}
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
          
          <div className={styles.compareSection}>            
            <Link 
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
// Update the getProductBySlug function to properly type the return value
async function getProductBySlug(slug: string): Promise<ProductData | null> {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return null;
    }
    
    const { db } = connection;
    
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
    
    if (!product) {
      return null;
    }
    
    // Convert MongoDB document to ProductData
    return {
      _id: product._id,
      productName: product.productName || 'Unknown Product',
      slug: product.slug,
      category: product.category,
      award: product.award,
      subtitle: product.subtitle,
      image: product.image,
      price: product.price,
      priceRange: product.priceRange,
      affiliateLink: product.affiliateLink,
      link: product.link,
      shortSummary: product.shortSummary,
      pros: product.pros,
      cons: product.cons,
      review: product.review,
      fullReview: product.fullReview
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
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