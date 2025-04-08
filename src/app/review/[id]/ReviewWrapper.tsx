'use client';

import { useEffect } from 'react';
import styles from './review.module.css';

export default function ReviewWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const productId = window.location.hash.replace('#product-', '').trim();
      
      console.log("Hash detected, looking for product:", productId);
      
      // First scroll to top to ensure we start from the beginning
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
      
      // Function to scroll to the product
      const scrollToProduct = () => {
        const productElement = document.getElementById(`product-${productId}`);
        if (productElement) {
          console.log(`Found element, scrolling to product: ${productId}`);
          
          // Use smooth scrolling with an offset to show some context
          window.scrollTo({
            top: productElement.offsetTop - 120, // Slightly larger offset for better context
            behavior: 'smooth'
          });
          
          return true;
        }
        console.log(`Element not found for product: ${productId}`);
        return false;
      };
      
      // Try to scroll after a delay to ensure DOM is fully loaded and rendered
      setTimeout(() => {
        if (!scrollToProduct()) {
          // If not successful, try again after a delay
          console.log("First scroll attempt failed, trying again in 800ms");
          setTimeout(() => {
            scrollToProduct();
          }, 800);
        }
      }, 500); // Longer initial delay for better reliability
    }
  }, []);

  return <div className={styles.container}>{children}</div>;
}