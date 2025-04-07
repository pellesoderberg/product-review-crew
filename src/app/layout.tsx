import type { Metadata } from 'next';
import { Inter, Kanit } from 'next/font/google';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar/SearchBar';
import './globals.css';
import styles from './layout.module.css';

// Load the Inter font for general text
const inter = Inter({ subsets: ['latin'] });

// Load the Kanit font for the logo
const kanit = Kanit({ 
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-kanit',
});

export const metadata: Metadata = {
  title: 'Product Review Crew',
  description: 'Expert product reviews and comparisons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${kanit.variable}`}>
      <body>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link href="/" className={styles.logoText}>PRODUCT-REVIEW-CREW</Link>
            </div>
            <nav className={styles.nav}>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/reviews">Reviews</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/resellers">For resellers</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div className={styles.searchBarContainer}>
          <SearchBar />
        </div>
        
        {children}
        
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p>&copy; {new Date().getFullYear()} Product Review Crew. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
