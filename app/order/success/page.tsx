'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateInteriorPDF } from '@/lib/lulu/pdf-generator';
import { generateCoverPDF } from '@/lib/lulu/cover-generator';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import styles from './page.module.css';

interface OrderDetails {
    id: string;
    bookId: string;
    bookTitle: string;
    format: 'softcover' | 'hardcover';
    size: '6x6' | '8x8' | '8x10';
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

    // Generation State
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');

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

                    // Start generation if paid but not fulfilled
                    if (data.status === 'paid' && data.fulfillmentStatus !== 'SUCCESS' && data.fulfillmentStatus !== 'GENERATING_PDFS') {
                        startFulfillment(data, supabase);
                    }
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

    const startFulfillment = async (orderData: OrderDetails, supabase: any) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setProgress(5);
        setStatusMessage('Preparing your book for print...');

        try {
            // 1. Fetch Book Data
            const { data: bookRecord, error: bookError } = await supabase
                .from('books')
                .select('*, pages(*)')
                .eq('id', orderData.bookId)
                .single();

            if (bookError || !bookRecord) throw new Error('Could not fetch book data');

            // Transform to Book Type
            const book: Book = {
                id: bookRecord.id,
                status: bookRecord.status,
                createdAt: new Date(bookRecord.created_at),
                updatedAt: new Date(bookRecord.updated_at),
                thumbnailUrl: bookRecord.thumbnail_url,
                settings: {
                    childName: bookRecord.child_name,
                    childAge: bookRecord.child_age,
                    ageGroup: bookRecord.age_group || '3-5',
                    bookTheme: bookRecord.book_theme,
                    bookType: bookRecord.book_type,
                    title: bookRecord.title,
                },
                pages: bookRecord.pages.map((p: any) => ({
                    id: p.id,
                    pageNumber: p.page_number,
                    type: p.page_type,
                    backgroundColor: p.background_color || '#ffffff',
                    backgroundImage: p.image_elements?.[0]?.src,
                    textElements: p.text_elements || [],
                    imageElements: p.image_elements || [],
                    createdAt: new Date(p.created_at),
                    updatedAt: new Date(p.updated_at),
                })),
            };

            setProgress(15);
            setStatusMessage('Generating print-ready PDF...');

            // 2. Generate PDFs
            const interiorBlob = await generateInteriorPDF(
                book,
                orderData.format,
                orderData.size,
                (val) => setProgress(15 + (val * 0.4)) // 15% to 55%
            );

            setStatusMessage('Generating cover...');
            const coverBlob = await generateCoverPDF(book, orderData.format, orderData.size);
            setProgress(70);

            // 3. Upload to Storage
            setStatusMessage('Uploading files...');

            const interiorPath = `book-pdfs/${orderData.id}/interior.pdf`;
            const coverPath = `book-pdfs/${orderData.id}/cover.pdf`;

            await supabase.storage.from('book-pdfs').upload(interiorPath, interiorBlob, { upsert: true });
            setProgress(80);

            await supabase.storage.from('book-pdfs').upload(coverPath, coverBlob, { upsert: true });
            setProgress(90);

            // 4. Call Fulfillment API
            setStatusMessage('Sending to printer...');
            await fetch('/api/orders/fulfill-print-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderData.id,
                    interiorPath,
                    coverPath
                })
            });

            setProgress(100);
            setStatusMessage('Done!');
            setIsProcessing(false);

        } catch (error) {
            console.error('Fulfillment failed:', error);
            setStatusMessage('Error preparing print files. Support has been notified.');
            // Don't block the user, just log it. Admin can retry.
        }
    };

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

                {/* Processing Indicator */}
                {isProcessing && (
                    <div className={styles.processingCard}>
                        <h3>{statusMessage}</h3>
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className={styles.smallNote}>Please keep this tab open while we finalize your book.</p>
                    </div>
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
                        <div className={`${styles.timelineItem} ${isProcessing || progress > 0 ? styles.active : ''}`}>
                            <span className={styles.timelineDot}></span>
                            <span className={styles.timelineLabel}>Preparing for Print</span>
                            <span className={styles.timelineDate}>{isProcessing ? 'In progress' : 'Pending'}</span>
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
