'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import SearchBar from '../SearchBar/SearchBar';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) {
        setMenuOpen(false);
      }
    };
    
    // Add event listener when menu is open
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);
  
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          PRODUCT-REVIEW-CREW
        </Link>
        
        <div className={styles.rightContainer}>
          <div className={styles.searchContainer}>
            <SearchBar />
          </div>
          
          <button 
            className={`${styles.menuButton} ${menuOpen ? styles.menuOpen : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className={styles.menuIcon}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
        
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/search?all=true" className={styles.navLink} onClick={() => setMenuOpen(false)}>Reviews</Link>
          <Link href="/about" className={styles.navLink} onClick={() => setMenuOpen(false)}>About Us</Link>
          {/* <Link href="/resellers" className={styles.navLink} onClick={() => setMenuOpen(false)}>For resellers</Link>*/}
        </nav>
        
        <div className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ''}`} onClick={() => setMenuOpen(false)}></div>
      </div>
    </header>
  );
}