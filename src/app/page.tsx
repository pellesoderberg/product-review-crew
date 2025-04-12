import Link from 'next/link';
import Image from 'next/image';
import RelatedReviews from '@/components/RelatedReviews';
import styles from './page.module.css';
import heroStyles from './hero.module.css';
import { connectToDatabase } from '@/lib/mongodb';

export default async function Home() {
  const featuredProduct = await getFeaturedProduct();

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
            <Image
              src={featuredProduct.image}
              alt={featuredProduct.productName || "Product"}
              width={600}
              height={400}
              className="max-w-full h-auto object-contain"
            />
          ) : (
            <div className="bg-gray-200 w-full h-[400px] flex items-center justify-center">
              <span className="text-gray-500">Product image</span>
            </div>
          )}
        </div>
      </section>

      {/* Add RelatedReviews component at the bottom */}
      <section className={styles.relatedReviewsSection}>
        <div className={styles.container}>
          {featuredProduct?.category ? (
            <RelatedReviews category={featuredProduct.category} />
          ) : (
            <RelatedReviews category="electronics" />
          )}
        </div>
      </section>
    </main>
  );
}

// Helper functions

async function getFeaturedProduct() {
  try {
    const { db } = await connectToDatabase();

    if (!db) {
      throw new Error("Database connection failed");
    }

    const product = await db.collection('product_reviews')
      .findOne(
        { image: { $exists: true, $ne: "" } },
        { sort: { createdAt: -1 } }
      );

    return product;
  } catch (error) {
    console.error('Error fetching featured product:', error);
    return null;
  }
}
