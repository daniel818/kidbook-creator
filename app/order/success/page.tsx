'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface OrderDetails {
    id: string;
    bookId: string;
    bookTitle: string;
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
    quantity: number;
    total: string;
    status: string;
    fulfillmentStatus: string;
    estimatedDelivery: string;
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confetti, setConfetti] = useState(true);
    const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            router.push('/');
            return;
        }

        const supabase = createClient();

        // Fetch order details
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/session/${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data);
                }
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();

        const timer = setTimeout(() => setConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, [sessionId, router]);

    useEffect(() => {
        if (!order?.bookId) return;
        let attempts = 0;
        const maxAttempts = 4;

        const tryUnlock = async () => {
            attempts += 1;
            try {
                const response = await fetch(`/api/books/${order.bookId}/unlock`, { method: 'POST' });
                if (response.ok) {
                    setUnlockMessage('Your full book is ready in the viewer.');
                    return;
                }
                if (response.status === 402 && attempts < maxAttempts) {
                    setUnlockMessage('Payment confirmed. Generating your full book...');
                    setTimeout(tryUnlock, 1500);
                    return;
                }
            } catch {
                // ignore
            }
        };

        tryUnlock();
    }, [order?.bookId]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your order...</p>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {confetti && (
                <div className={styles.confettiContainer}>
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className={styles.confetti}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'][Math.floor(Math.random() * 5)],
                            }}
                        />
                    ))}
                </div>
            )}

            <motion.div
                className={styles.container}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    className={styles.successIcon}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <span>✅</span>
                </motion.div>

                <h1 className={styles.title}>Order Confirmed!</h1>
                <p className={styles.subtitle}>
                    Thank you for your order. We are preparing your personalized book!
                </p>
                {unlockMessage && (
                    <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
                        {unlockMessage}
                    </p>
                )}



                <div className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                        <span className={styles.orderIcon}>📦</span>
                        <div>
                            <h2>Order #{order?.id?.slice(0, 8) || sessionId?.slice(0, 8)}</h2>
                            <span className={`${styles.status} ${styles.processing}`}>Processing</span>
                        </div>
                    </div>

                    {order && (
                        <div className={styles.orderDetails}>
                            <div className={styles.detailRow}>
                                <span>Book</span>
                                <span>{order.bookTitle}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Format</span>
                                <span>{order.format} - {order.size}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Quantity</span>
                                <span>×{order.quantity}</span>
                            </div>
                            <div className={`${styles.detailRow} ${styles.total}`}>
                                <span>Total Paid</span>
                                <span>{order.total}</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.timeline}>
                        <div className={`${styles.timelineItem} ${styles.completed}`}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Order Placed</span>
                            <span className={styles.timelineDate}>Just now</span>
                        </div>
                        <div className={`${styles.timelineItem} ${!order?.fulfillmentStatus || order.fulfillmentStatus === 'PENDING' ? styles.active : ''}`}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Preparing for Print</span>
                            <span className={styles.timelineDate}>Checking files...</span>
                        </div>
                        <div className={styles.timelineItem}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Printing</span>
                            <span className={styles.timelineDate}>Est. 2-3 days</span>
                        </div>
                        <div className={styles.timelineItem}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Shipped</span>
                            <span className={styles.timelineDate}>Est. 5-7 days</span>
                        </div>
                        <div className={styles.timelineItem}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Delivered</span>
                            <span className={styles.timelineDate}>Est. 7-10 days</span>
                        </div>
                    </div>
                </div>

                <div className={styles.emailNotice}>
                    <span className={styles.emailIcon}>📧</span>
                    <p>
                        We&apos;ve sent a confirmation email with your order details and tracking information.
                    </p>
                </div>

                <div className={styles.actions}>
                    <Link href="/" className={styles.homeButton}>
                        ← Back to Home
                    </Link>
                    <Link href="/create" className={styles.createButton}>
                        Create Another Book
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your order...</p>
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
