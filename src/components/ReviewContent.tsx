'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ReviewContentProps {
  review: any;
}

export default function ReviewContent({ review }: ReviewContentProps) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if there's a hash in the URL to scroll to a specific product
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        // Scroll to the element with a slight delay to ensure rendering is complete
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{review.reviewTitle}</h1>
      
      {/* Review summary */}
      {review.reviewSummary && (
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <p>{review.reviewSummary}</p>
        </div>
      )}
      
      {/* Main review content */}
      <div className="prose max-w-none mb-10">
        {review.comparisonReview && (
          <div dangerouslySetInnerHTML={{ __html: review.comparisonReview.replace(/\n/g, '<br />') }} />
        )}
      </div>
      
      {/* Products section */}
      {review.productDetails && review.productDetails.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {review.productDetails.map((product: any) => (
              <div 
                key={product._id} 
                id={`product-${product._id}`} 
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{product.productName}</h3>
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.productName} 
                    className="w-full h-48 object-contain mb-4"
                  />
                )}
                <p className="text-gray-700 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  {product.price && (
                    <span className="font-bold text-lg">${product.price}</span>
                  )}
                  {product.affiliateLink && (
                    <a 
                      href={product.affiliateLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Check Price
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}