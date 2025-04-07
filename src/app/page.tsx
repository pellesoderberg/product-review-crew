import Image from "next/image";
import Link from 'next/link';
import SearchBar from '@/components/SearchBar/SearchBar';
import styles from './page.module.css';
import { connectToDatabase } from '@/lib/mongodb';

// Make the component async to fetch data
export default async function Home() {
  // Fetch the first product from the database
  let imagePath = '/images/default-product.jpg';
  let productName = 'Featured Product';
  
  try {
    const { db } = await connectToDatabase();
    // Fix: Use the correct collection name for MongoDB
    const firstProduct = await db.collection('product_reviews').findOne(
      {}, // empty filter to get any product
      { sort: { createdAt: -1 } } // sort by creation date, newest first
    );

    console.log('Found product:', firstProduct ? firstProduct.productName : 'None');
    
    if (firstProduct && firstProduct.image) {
      imagePath = firstProduct.image;
      productName = firstProduct.productName || 'Featured Product';
    } else {
      console.log('No product image found, using default');
    }
  } catch (error) {
    console.error('Error fetching product image:', error);
  }

  return (
    <main className={styles.main}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.reviewHeading}>
            <h1>NEW REVIEW</h1>
            <p>
              WE'VE SET BOLD AND AMBITIOUS TARGETS FOR 2025 
              AGAINST OUR FOCUS AREAS OS PEOPLE, PLANET AND PLAY. 
              LEARN MORE ABOUT OUR JOURNEY TO A BETTER FUTURE
            </p>
            <Link href="/review/latest" className={styles.showReviewButton}>
              SHOW REVIEW
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image 
            src={imagePath}
            alt={productName}
            width={500} 
            height={400}
            priority
            unoptimized={true} // Add this to handle external URLs
          />
        </div>
      </div>
    </main>
  );
}
