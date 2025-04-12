import Image from "next/image";
import Link from 'next/link';
import SearchBar from '@/components/SearchBar/SearchBar';
import RelatedReviews from '@/components/RelatedReviews';
import styles from './page.module.css';
import heroStyles from './hero.module.css';
import { connectToDatabase } from '@/lib/mongodb';

export default async function Home() {
  const featuredProduct = await getFeaturedProduct();
  const featuredReview = featuredProduct ? await getReviewForProduct(featuredProduct.category) : null;
  
  return (
    <main>
      {/* Hero section with featured product */}
      <section className={heroStyles.heroSection}>
        <div className={heroStyles.heroContent}>
          <div className={heroStyles.newReviewTag}>NEW REVIEW!</div>
          <h1 className={heroStyles.heroTitle}>
            {featuredProduct?.productName || "NEW REVIEW"}
          </h1>
          <p className={heroStyles.heroText}>
            {featuredProduct?.shortSummary || "WE'VE SET BOLD AND AMBITIOUS TARGETS FOR 2025 AGAINST OUR FOCUS AREAS OS PEOPLE, PLANET AND PLAY. LEARN MORE ABOUT OUR JOURNEY TO A BETTER FUTURE"}
          </p>
          {/* Updated to format the award properly in the URL */}
          <Link href={featuredProduct 
            ? `/product/${featuredProduct.slug || featuredProduct._id}/${(featuredProduct.award || 'best-choice').toLowerCase().replace(/\s+/g, '-')}` 
            : "/search"}>
            <button className={heroStyles.heroButton}>
              SHOW PRODUCT
            </button>
          </Link>
        </div>
        <div className={heroStyles.heroImage}>
          {featuredProduct?.image ? (
            <img 
              src={featuredProduct.image} 
              alt={featuredProduct.productName} 
              className="max-w-full h-auto"
            />
          ) : (
            <div className="bg-gray-200 w-full h-[400px] flex items-center justify-center">
              <span className="text-gray-500">Product image</span>
            </div>
          )}
        </div>
      </section>
      
      {/* Rest of your homepage content */}
      
      {/* Add RelatedReviews component at the bottom */}
      <section className={styles.relatedReviewsSection}>
        <div className={styles.container}>
          {featuredProduct && featuredProduct.category ? (
            <RelatedReviews category={featuredProduct.category} />
          ) : (
            <RelatedReviews category="electronics" />
          )}
        </div>
      </section>
    </main>
  );
}

// Helper function to get a featured product
async function getFeaturedProduct() {
  try {
    const { db } = await connectToDatabase();
    
    // Get a random featured product or the most recent one
    const product = await db.collection('product_reviews')
      .findOne(
        { image: { $exists: true, $ne: "" } }, // Make sure it has an image
        { sort: { createdAt: -1 } } // Get the most recent
      );
    
    return product;
  } catch (error) {
    console.error('Error fetching featured product:', error);
    return null;
  }
}

// Helper function to get a review for a product category
async function getReviewForProduct(category: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Find a review in the same category as the product
    const review = await db.collection('comparison_reviews')
      .findOne({ category: category });
    
    return review;
  } catch (error) {
    console.error('Error fetching review for product:', error);
    return null;
  }
}
