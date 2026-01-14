import Link from 'next/link';
import styles from './page.module.css';

export default function AuthErrorPage() {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <span className={styles.icon}>😕</span>
                <h1>Authentication Error</h1>
                <p>
                    Something went wrong during the authentication process.
                    This could happen if the link expired or was already used.
                </p>
                <Link href="/" className={styles.button}>
                    ← Back to Home
                </Link>
            </div>
        </main>
    );
}
