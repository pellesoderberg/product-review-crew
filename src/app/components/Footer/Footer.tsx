import Link from 'next/link';
import styles from './Footer.module.css';
import heroStyles from '../Hero/hero.module.css';


export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Product-Review-Crew</h3>
            <p className={heroStyles.footerDescription}>
              AI-powered product reviews based on thousands of real user experiences.
            </p>
          </div>
          
          <div className={heroStyles.footerSection}>
            <h3 className={heroStyles.footerTitle}>Quick Links</h3>
            <ul className={heroStyles.footerLinks}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/search?all=true">Reviews</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>
          
          <div className={heroStyles.footerSection}>
            <h3 className={heroStyles.footerTitle}>Follow Us</h3>
            <ul className={heroStyles.footerLinks}>
              <li><a href="https://twitter.com/product-review-crew" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://instagram.com/product-review-crew" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://facebook.com/product-review-crew" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} Product Review Crew. All rights reserved.
          </p>
          <p className={styles.disclaimer}>
            Product Review Crew is reader-supported. When you buy through links on our site, we may earn an affiliate commission.
          </p>
        </div>
      </div>
    </footer>
  );
}