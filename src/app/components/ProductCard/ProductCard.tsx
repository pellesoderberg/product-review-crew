import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  price: string;
  summary: string;
  pros: string[];
  cons: string[];
  award?: string;
  ranking?: number;
}

export default function ProductCard({
  id,
  name,
  image,
  price,
  summary,
  pros,
  cons,
  award,
  ranking
}: ProductCardProps) {
  return (
    <div className={styles.productCard}>
      <div className={styles.productHeader}>
        {ranking && <div className={styles.ranking}>{ranking}</div>}
        {award && <div className={styles.award}>{award}</div>}
      </div>
      
      <div className={styles.imageContainer}>
        <Image 
          src={image} 
          alt={name}
          width={200}
          height={200}
          className={styles.productImage}
        />
      </div>
      
      <h3 className={styles.productName}>{name}</h3>
      
      <p className={styles.shortSummary}>{summary}</p>
      
      <div className={styles.priceContainer}>
        <span className={styles.price}>{price}</span>
      </div>
      
      <div className={styles.prosConsContainer}>
        <div className={styles.pros}>
          <h3>Pros</h3>
          <ul>
            {pros.slice(0, 3).map((pro, index) => (
              <li key={index}>{pro}</li>
            ))}
          </ul>
        </div>
        
        <div className={styles.cons}>
          <h3>Cons</h3>
          <ul>
            {cons.slice(0, 3).map((con, index) => (
              <li key={index}>{con}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <Link href={`/product/${id}`} className={styles.productLink}>
        View Details
      </Link>
    </div>
  );
}