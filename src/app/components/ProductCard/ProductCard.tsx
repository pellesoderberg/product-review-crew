import Image from 'next/image';
import { Product } from '@/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  showDetails?: boolean;
}

export default function ProductCard({ product, showDetails = false }: ProductCardProps) {
  return (
    <div className={styles.productCard}>
      {product.ranking && (
        <div className={styles.productHeader}>
          <span className={styles.ranking}>#{product.ranking}</span>
          <span className={styles.award}>{product.award}</span>
        </div>
      )}
      
      {product.image && (
        <div className={styles.imageContainer}>
          <Image 
            src={product.image} 
            alt={product.productName}
            width={300}
            height={300}
            className={styles.productImage}
          />
        </div>
      )}
      
      <h2 className={styles.productName}>{product.productName}</h2>
      <p className={styles.shortSummary}>{product.shortSummary}</p>
      
      <div className={styles.priceContainer}>
        <span className={styles.price}>{product.priceRange}</span>
      </div>
      
      {showDetails && (
        <>
          <div className={styles.prosConsContainer}>
            <div className={styles.pros}>
              <h3>Pros</h3>
              <ul>
                {product.pros.map((pro, index) => (
                  <li key={index}>{pro}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.cons}>
              <h3>Cons</h3>
              <ul>
                {product.cons.map((con, index) => (
                  <li key={index}>{con}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {product.link && (
            <a 
              href={product.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.productLink}
            >
              View Product
            </a>
          )}
        </>
      )}
    </div>
  );
}