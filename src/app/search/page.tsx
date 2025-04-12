import { connectToDatabase } from '@/lib/mongodb';
import Link from 'next/link';
import styles from './search.module.css';
import Image from 'next/image';
import { ObjectId } from 'mongodb';

// Define the Product interface
interface Product {
  _id: string | ObjectId;
  productName: string;
  image: string;
  slug?: string;
  category?: string;
  priceRange?: string;
  price?: string;
  shortSummary?: string;
  fullReview?: string;
}

// Update the SearchPageProps type to use Promise for searchParams
type SearchPageProps = {
  searchParams: Promise<{ q: string }>
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Await the searchParams to get the query
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  
  // If no query, show empty search page
  if (!query) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Search Products</h1>
        <p className={styles.emptyMessage}>Enter a search term to find products</p>
      </div>
    );
  }
  
  // Search for products matching the query
  const results = await searchProducts(query);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search Results for {query}</h1>
      
      {results.length === 0 ? (
        <p className={styles.emptyMessage}>No products found matching your search</p>
      ) : (
        <div className={styles.resultsGrid}>
          {results.map((product: Product) => (
            <Link 
              href={`/product/${product.slug || product._id}`} 
              key={product._id.toString()}
              className={styles.productCard}
            >
              <div className={styles.productImageContainer}>
                <Image 
                  src={product.image || '/placeholder.jpg'} 
                  alt={product.productName}
                  width={200}
                  height={200}
                  className={styles.productImage}
                />
              </div>
              <div className={styles.productInfo}>
                <h2 className={styles.productName}>{product.productName}</h2>
                <p className={styles.productCategory}>{product.category}</p>
                <p className={styles.productPrice}>{product.priceRange || product.price || '$399'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Function to search for products
async function searchProducts(query: string): Promise<Product[]> {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !connection.db) {
      console.error('Database connection failed');
      return [];
    }
    
    const { db } = connection;
    
    // Create a case-insensitive regex for the search query
    const searchRegex = new RegExp(query, 'i');
    
    // Search in product name, category, and description
    const productDocs = await db.collection('product_reviews')
      .find({
        $or: [
          { productName: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          { shortSummary: { $regex: searchRegex } },
          { fullReview: { $regex: searchRegex } }
        ]
      })
      .limit(20)
      .toArray();
    
    // Map MongoDB documents to Product interface
    const products: Product[] = productDocs.map(doc => ({
      _id: doc._id,
      productName: doc.productName || 'Unknown Product',
      image: doc.image || '/placeholder.jpg',
      slug: doc.slug,
      category: doc.category,
      priceRange: doc.priceRange,
      price: doc.price,
      shortSummary: doc.shortSummary,
      fullReview: doc.fullReview
    }));
    
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}