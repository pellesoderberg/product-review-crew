// ... existing code ...

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
            <div className="flex-1">
              <div className="font-medium">
                {suggestion.productName || suggestion.reviewTitle}
              </div>
              {suggestion.shortSummary && (
                <div className="text-sm text-gray-600 line-clamp-2">
                  {suggestion.shortSummary}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                {suggestion.type === 'product' ? 'Product' : 'Review'}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

// ... existing code ...