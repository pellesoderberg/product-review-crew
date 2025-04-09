import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SearchSuggestions({ 
  suggestions, 
  onSuggestionClick,
  visible 
}: {
  suggestions: any[];
  onSuggestionClick: (suggestion: any) => void;
  visible: boolean;
}) {
  const router = useRouter();

  if (!visible || !suggestions.length) {
    return null;
  }

  // Let's update the handleSuggestionClick function to ensure proper routing
  const handleSuggestionClick = (suggestion: any) => {
    // Call the parent's click handler to close the suggestions
    onSuggestionClick(suggestion);
    
    // For products, redirect to a dedicated product page
    if (suggestion.type === 'product') {
      router.push(`/product/${suggestion._id}`);
    } else if (suggestion.type === 'review') {
      // Direct navigation to review page
      router.push(`/review/${suggestion.slug || suggestion._id}`);
    }
  };

  return (
    <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-80 overflow-y-auto">
      <ul className="py-1">
        {suggestions.map((suggestion) => (
          <li 
            key={suggestion._id} 
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex items-center">
              {suggestion.image && (
                <img 
                  src={suggestion.image} 
                  alt={suggestion.productName || suggestion.reviewTitle} 
                  className="w-10 h-10 object-cover mr-3"
                />
              )}
              <div>
                <div className="font-medium">
                  {suggestion.productName || suggestion.reviewTitle}
                </div>
                <div className="text-sm text-gray-500">
                  {suggestion.type === 'product' ? 'Product' : 'Review'}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}