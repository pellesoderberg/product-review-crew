import Link from 'next/link';
import styles from './Header.module.css';
import SearchBar from './SearchBar/SearchBar';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          PRODUCT-REVIEW-CREW
        </Link>
        
        <div className={styles.searchContainer}>
          <SearchBar />
        </div>
        
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/search?all=true" className={styles.navLink}>Reviews</Link>
          <Link href="/about" className={styles.navLink}>About Us</Link>
          <Link href="/resellers" className={styles.navLink}>For resellers</Link>
        </nav>
      </div>
    </header>
  );
}