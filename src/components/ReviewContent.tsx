import React from 'react';
import Image from 'next/image';
// Removed unused Link import
import { connectToDatabase } from '@/lib/mongodb';
import styles from './ReviewContent.module.css';
import { Document, WithId, ObjectId } from 'mongodb';

// Define proper types for the data structures
interface Product {
  _id: string;
  productName: string;
  image: string;
  price?: string;
  shortSummary?: string;
  award?: string;
}

interface ReviewContentProps {
  reviewId: string;
  // Removed unused searchParams
}

export default async function ReviewContent({ reviewId }: ReviewContentProps) {
  const reviewData = await getReviewData(reviewId);
  
  if (!reviewData) {
    return <div>Review not found</div>;
  }
  
  const { review, products } = reviewData;
  
  return (
    <div className={styles.reviewContent}>
      <h1 className={styles.reviewTitle}>{review.title}</h1>
      <p className={styles.reviewSummary}>{review.summary}</p>
      
      <div className={styles.productsGrid}>
        {/* Cast products to Product[] to fix the type error */}
        {(products as Product[]).map((product: Product, index: number) => (
          <div key={product._id} className={styles.productCard}>
            <div className={styles.productRank}>#{index + 1}</div>
            <h2 className={styles.productName}>{product.productName}</h2>
            <div className={styles.productImageContainer}>
              <Image 
                src={product.image} 
                alt={product.productName}
                width={200}
                height={200}
                className={styles.productImage}
              />
            </div>
            <div className={styles.productInfo}>
              <div className={styles.productPrice}>{product.price || '$399'}</div>
              <div className={styles.productAward}>{product.award || 'Best Choice'}</div>
              <p className={styles.productSummary}>{product.shortSummary || 'No summary available'}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.reviewText}>
        {review.content}
      </div>
    </div>
  );
}

// In the getReviewData function, we need to add a null check for the database connection
// In the getReviewData function, we need to properly type our query objects
async function getReviewData(reviewId: string) {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return null;
    }
    
    const { db } = connection;
    
    // Convert string ID to ObjectId if it's a valid ObjectId format
    const query: { _id?: ObjectId; stringId?: string } = {};
    if (ObjectId.isValid(reviewId)) {
      query._id = new ObjectId(reviewId);
    } else {
      // If not a valid ObjectId, try to find by a string ID field or another identifier
      query.stringId = reviewId; // Adjust this based on your schema
    }
    
    const review = await db.collection('reviews').findOne(query);
    
    if (!review) {
      return null;
    }
    
    // Fetch the products referenced in the review
    const productQuery: { reviewId?: ObjectId; reviewStringId?: string } = {};
    if (ObjectId.isValid(reviewId)) {
      productQuery.reviewId = new ObjectId(reviewId);
    } else {
      productQuery.reviewStringId = reviewId; // Adjust based on your schema
    }
    
    const productDocs = await db.collection('products')
      .find(productQuery)
      .toArray();
    
    // Map MongoDB documents to Product interface
    const products: Product[] = productDocs.map((doc: WithId<Document>) => ({
      _id: doc._id.toString(),
      productName: doc.productName || 'Unknown Product',
      image: doc.image || '/placeholder.jpg',
      price: doc.price,
      shortSummary: doc.shortSummary,
      award: doc.award
    }));
    
    return { review, products };
  } catch (error) {
    console.error('Error fetching review data:', error);
    return null;
  }
}