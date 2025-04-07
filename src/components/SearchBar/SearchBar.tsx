"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchBar.module.css';

interface Suggestion {
  text: string;
  type: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the search component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&suggestions=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && data.suggestions.length > 0) {
            // Sort to put reviews at the top
            const sortedSuggestions = [...data.suggestions].sort((a, b) => {
              if (a.type === 'REVIEW' && b.type !== 'REVIEW') return -1;
              if (a.type !== 'REVIEW' && b.type === 'REVIEW') return 1;
              return 0;
            });
            setSuggestions(sortedSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Clear the search input before navigation
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (suggestion.type === 'REVIEW') {
      // For reviews, navigate directly to the review page
      router.push(`/api/search/getReviewByTitle?title=${encodeURIComponent(suggestion.text)}`);
    } else {
      // For products, search for the product and then scroll to it on the results page
      router.push(`/search?q=${encodeURIComponent(suggestion.text)}&scrollToProduct=true`);
    }
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          placeholder="SEARCH REVIEW OR PRODUCT"
          className={styles.searchInput}
          autoComplete="off"
        />
        <button type="submit" className={styles.searchButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className={styles.suggestionText}>{suggestion.text}</div>
              <div className={styles.suggestionType}>
                {suggestion.type}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.loadingDot}></div>
          <div className={styles.loadingDot}></div>
          <div className={styles.loadingDot}></div>
        </div>
      )}
    </div>
  );
}