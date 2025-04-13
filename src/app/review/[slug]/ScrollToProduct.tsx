'use client';

import { useEffect } from 'react';

export function ScrollToProduct() {
  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const productId = window.location.hash.replace('#product-', '');
      
      // Give the DOM time to render before scrolling
      setTimeout(() => {
        const productElement = document.getElementById(`product-${productId}`);
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);

  return null; // This component doesn't render anything
}