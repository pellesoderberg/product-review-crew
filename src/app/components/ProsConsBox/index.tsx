import styles from './ProsConsBox.module.css';

interface ProsConsBoxProps {
  pros: string[];
  cons: string[];
}

export default function ProsConsBox({ pros, cons }: ProsConsBoxProps) {
  return (
    <div className={styles.prosConsContainer}>
      <div className={styles.prosConsColumn}>
        <h3>Pros</h3>
        <ul className={styles.prosList}>
          {pros.map((pro, index) => (
            <li key={index} className={styles.proItem}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.proContent}>{pro}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className={styles.prosConsColumn}>
        <h3>Cons</h3>
        <ul className={styles.consList}>
          {cons.map((con, index) => (
            <li key={index} className={styles.conItem}>
              <span className={styles.minusIcon}>-</span>
              <span className={styles.conContent}>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}