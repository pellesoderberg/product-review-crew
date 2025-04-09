import React from 'react';
import styles from './ProsConsBox.module.css';

interface ProsConsBoxProps {
  pros: string[];
  cons: string[];
}

const ProsConsBox: React.FC<ProsConsBoxProps> = ({ pros, cons }) => {
  return (
    <div className={styles.prosConsContainer}>
      <div className={styles.prosConsColumn}>
        <ul className={styles.prosList}>
          {pros && pros.length > 0 ? (
            pros.map((pro, index) => (
              <li key={`pro-${index}`} className={styles.proItem}>
                <span className={styles.plusIcon}>+</span>
                <span className={styles.proContent}>{pro}</span>
              </li>
            ))
          ) : (
            <li className={styles.proItem}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.proContent}>High quality product</span>
            </li>
          )}
        </ul>
      </div>
      
      <div className={styles.prosConsColumn}>
        <ul className={styles.consList}>
          {cons && cons.length > 0 ? (
            cons.map((con, index) => (
              <li key={`con-${index}`} className={styles.conItem}>
                <span className={styles.minusIcon}>-</span>
                <span className={styles.conContent}>{con}</span>
              </li>
            ))
          ) : (
            <li className={styles.conItem}>
              <span className={styles.minusIcon}>-</span>
              <span className={styles.conContent}>Higher price point</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProsConsBox;