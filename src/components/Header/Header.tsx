import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  // Add a function to handle link clicks and scroll to top
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={handleLinkClick}>
          Product Review Crew
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink} onClick={handleLinkClick}>
            Home
          </Link>
          <Link href="/search" className={styles.navLink} onClick={handleLinkClick}>
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}