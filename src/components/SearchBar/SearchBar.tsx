'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to fetch suggestions
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        console.log('Searching for:', query);
        
        // Search for both reviews and products
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          console.error('Search API returned status:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Process the results
        let reviewsArray = [];
        let productsArray = [];
        
        // Extract reviews and products from the response
        if (Array.isArray(data)) {
          // If it's a flat array, determine type by properties
          reviewsArray = data.filter(item => item.reviewTitle);
          productsArray = data.filter(item => item.productName);
        } else {
          // Handle structured response
          if (data.reviews && Array.isArray(data.reviews)) {
            reviewsArray = data.reviews;
          } else if (data.results && Array.isArray(data.results)) {
            reviewsArray = data.results.filter((item: any) => item.reviewTitle);
          }
          
          if (data.products && Array.isArray(data.products)) {
            productsArray = data.products;
          } else if (data.results && Array.isArray(data.results)) {
            productsArray = data.results.filter((item: any) => item.productName);
          }
        }
        
        // Format reviews
        const formattedReviews = reviewsArray.map(item => ({
          _id: item._id?.$oid || item._id,
          title: item.reviewTitle || item.title,
          type: 'review'
        }));
        
        // Format products
        const formattedProducts = productsArray.map(item => ({
          _id: item._id?.$oid || item._id,
          title: item.productName || item.name,
          type: 'product',
          slug: item.slug || item.productName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
          award: item.award // Make sure to include the award field
        }));
        
        // Combine and prioritize reviews first
        let combinedResults = [...formattedReviews, ...formattedProducts];
        
        // Limit to 3 suggestions total
        combinedResults = combinedResults.slice(0, 3);
        
        console.log('Combined results:', combinedResults);
        setSuggestions(combinedResults);
        setShowSuggestions(combinedResults.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    // Debounce the search
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
      setQuery(''); // Clear the search text after submitting
    }
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="SEARCH REVIEW OR PRODUCT"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((item, index) => {
            return (
              <div 
                key={index}
                className={styles.suggestionItem}
                onClick={() => {
                  setShowSuggestions(false);
                  setQuery(''); // Clear the search text when clicking a suggestion
                  
                  // Handle different types of suggestions
                  // Update the product suggestion click handler in SearchBar.tsx
                  if (item.type === 'product') {
                  // Use slug and award for SEO-friendly URL
                  const award = item.award || 'details';
                  const seoAward = award.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  console.log("Navigating to product with award:", award, "SEO award:", seoAward);
                  router.push(`/product/${item.slug}/${seoAward}`);
                  } else {
                  // For reviews, navigate directly to the review page
                  router.push(`/review/${item._id}`);
                  }
                }}
              >
                <span>{item.title || query}</span>
                <span className={styles.suggestionType}>{item.type}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}