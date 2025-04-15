'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Removed unused Link import
import styles from './SearchBar.module.css';

// Define interfaces for the search results
interface SearchItem {
  _id: string;
  title: string;
  type: 'review' | 'product';
  slug?: string;
  award?: string;
}

interface ProductItem {
  _id: string | { $oid: string };
  productName?: string;
  name?: string;
  slug?: string;
  award?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Add this effect to clear search when clicking on navigation links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element is a link or inside a link
      if (target.tagName === 'A' || target.closest('a')) {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  useEffect(() => {
    // Function to fetch suggestions
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        console.log('Searching for:', query.length);
        setSuggestions([]);
        return;
      }

      try {
        console.log('Searching for:', query);
        
        // Search for both reviews and products
        // Fix: Send the actual query string instead of query.length
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
            reviewsArray = data.results.filter((item: { reviewTitle?: string }) => item.reviewTitle);
          }
          
          if (data.products && Array.isArray(data.products)) {
            productsArray = data.products;
          } else if (data.results && Array.isArray(data.results)) {
            productsArray = data.results.filter((item: { productName?: string }) => item.productName);
          }
        }
        
        // Define an interface for the review items
        interface ReviewItem {
          _id: string | { $oid: string };
          reviewTitle?: string;
          title?: string;
          slug?: string; // Add slug property to the interface
        }
        
        // Format reviews with proper typing
        const formattedReviews = reviewsArray.map((item: ReviewItem) => ({
          _id: typeof item._id === 'object' && item._id !== null && '$oid' in item._id 
            ? item._id.$oid 
            : item._id,
          title: item.reviewTitle || item.title,
          type: 'review' as const,
          slug: item.slug || '' // Add slug property for reviews
        }));
        
        // Format products
        const formattedProducts = productsArray.map((item: ProductItem) => ({
          _id: typeof item._id === 'object' && item._id !== null && '$oid' in item._id
          ? item._id.$oid
          : item._id,
          title: item.productName || item.name,
          type: 'product' as const,
          slug: item.slug || item.productName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
          award: item.award // Make sure to include the award field
        }));
        
        // Combine and prioritize reviews first
        let combinedResults = [...formattedReviews, ...formattedProducts];
        
        // Limit to 3 suggestions total
        combinedResults = combinedResults.slice(0, 10);
        
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
          placeholder="Search review or product"
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
                  if (item.type === 'product') {
                    // Use slug and award for SEO-friendly URL
                    const award = item.award || 'details';
                    const seoAward = award.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    console.log("Navigating to product with award:", award, "SEO award:", seoAward);
                    router.push(`/product/${item.slug}/${seoAward}`);
                  } else {
                    // For reviews, navigate using slug for SEO-friendly URL
                    // If slug is not available, fall back to ID
                    const reviewPath = item.slug || item._id;
                    router.push(`/review/${reviewPath}`);
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