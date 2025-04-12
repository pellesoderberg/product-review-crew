import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Page Not Found</h2>
      <p className={styles.description}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={styles.homeLink}>
        Go back home
      </Link>
    </div>
  );
}