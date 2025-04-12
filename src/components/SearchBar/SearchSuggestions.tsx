'use client';

//import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './SearchSuggestions.module.css';

// Define proper interfaces for the component props and suggestion items
interface SearchItem {
  _id: string;
  title: string;
  type: 'review' | 'product';
  slug?: string;
  image?: string;
  category?: string;
  award?: string;
}

interface SearchSuggestionsProps {
  suggestions: SearchItem[];
  onSelect: (item: SearchItem) => void;
  query: string;
}

export default function SearchSuggestions({ 
  suggestions, 
  onSelect, 
  query 
}: SearchSuggestionsProps) {
  //const router = useRouter();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={styles.suggestionsContainer}>
      {suggestions.map((item, index) => (
        <div 
          key={index} 
          className={styles.suggestionItem}
          onClick={() => onSelect(item)}
        >
          {item.image && (
            <div className={styles.imageContainer}>
              <Image 
                src={item.image} 
                alt={item.title}
                width={40}
                height={40}
                className={styles.suggestionImage}
              />
            </div>
          )}
          
          <div className={styles.suggestionContent}>
            <div className={styles.suggestionTitle}>
              {item.title || query}
            </div>
            {item.category && (
              <div className={styles.suggestionCategory}>
                {item.category}
              </div>
            )}
            <div className={styles.suggestionType}>
              {item.type === 'product' ? 'Product' : 'Review'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}