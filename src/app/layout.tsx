import type { Metadata } from 'next';
import { Inter, Kanit } from 'next/font/google';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar/SearchBar';
import './globals.css';
import Header from './components/Header';
import styles from './layout.module.css';
import Footer from '@/components/Footer/Footer';

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
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${kanit.variable}`}>
      <body className={`flex flex-col min-h-screen ${inter.className}`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
