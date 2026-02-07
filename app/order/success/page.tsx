'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
    thumbnailUrl?: string;
    childName?: string;
    pageCount?: number;
    shippingAddress?: {
        name?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

/** Map fulfillment status to timeline step index (0-based) */
function getTimelineStep(status?: string): number {
    switch (status?.toUpperCase()) {
        case 'CREATED':
        case 'UNPAID':
            return 0;
        case 'PENDING':
        case 'PRODUCTION_READY':
        case 'PRODUCTION_DELAYED':
            return 1;
        case 'IN_PRODUCTION':
            return 2;
        case 'SHIPPED':
        case 'DELIVERED':
            return 3;
        default:
            return 1; // Default to "Generating Files" active
    }
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    // Support both legacy (session_id) and new embedded flow (payment_intent + order_id)
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent');
    const orderIdParam = searchParams.get('order_id');

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

    useEffect(() => {
        // Need at least one identifier to proceed
        if (!sessionId && !paymentIntentId && !orderIdParam) {
            router.push('/');
            return;
        }

        // Fetch order details via the appropriate endpoint
        const fetchOrder = async () => {
            try {
                let response;
                if (orderIdParam) {
                    // New embedded flow — fetch by order ID
                    response = await fetch(`/api/orders/${orderIdParam}`);
                } else if (sessionId) {
                    // Legacy Checkout Session flow — fetch by session ID
                    response = await fetch(`/api/orders/session/${sessionId}`);
                }

                if (response?.ok) {
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
    }, [sessionId, paymentIntentId, orderIdParam, router]);

    useEffect(() => {
        if (!order?.bookId) return;
        let attempts = 0;
        const maxAttempts = 4;

        const tryUnlock = async () => {
            attempts += 1;
            try {
                // Build unlock URL with whichever identifier is available
                let unlockUrl = `/api/books/${order.bookId}/unlock`;
                if (sessionId) {
                    unlockUrl += `?session_id=${sessionId}`;
                } else if (paymentIntentId) {
                    unlockUrl += `?payment_intent=${paymentIntentId}`;
                }
                const response = await fetch(unlockUrl, { method: 'POST' });
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
    }, [order?.bookId, sessionId, paymentIntentId]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your order...</p>
            </div>
        );
    }

    const orderId = order?.id || orderIdParam || sessionId || '';
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    const timelineStep = getTimelineStep(order?.fulfillmentStatus);
    const childName = order?.childName || order?.bookTitle?.replace(/^The Adventures of\s*/i, '') || '';
    const formatLabel = order ? `${order.format === 'hardcover' ? 'Hardcover' : 'Softcover'}, ${order.size} inches` : '';
    const pageCount = order?.pageCount || 24;

    // Build shipping address string
    const addr = order?.shippingAddress;
    const estimatedDelivery = order?.estimatedDelivery || 'Est. 7-14 business days';

    const timelineSteps = [
        { icon: 'check', label: 'Order Received', meta: "We've got the details perfectly." },
        { icon: 'sync', label: 'Generating Files', meta: 'Preparing for the press...' },
        { icon: 'print', label: 'Printing & Binding', meta: 'Scheduled for tomorrow' },
        { icon: 'package_2', label: 'Shipped', meta: '' },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.pageInner}>
                {/* Decorative confetti icons */}
                <div className={styles.confettiIcons}>
                    <div className={styles.confettiIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>star</span>
                    </div>
                    <div className={styles.confettiIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>celebration</span>
                    </div>
                    <div className={styles.confettiIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>circle</span>
                    </div>
                    <div className={styles.confettiIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>favorite</span>
                    </div>
                </div>

                {/* Hero Header */}
                <header className={styles.header}>
                    <div className={styles.checkIconWrapper}>
                        <div className={styles.checkIconInner}>
                            <span className="material-symbols-outlined" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                    </div>
                    <h1 className={styles.title}>Order Confirmed!</h1>
                    <p className={styles.subtitle}>
                        Hooray! {childName ? (
                            <><span className={styles.childName}>{childName}&apos;s</span> story is being brought to life.</>
                        ) : (
                            <>Your story is being brought to life.</>
                        )}
                    </p>
                    {unlockMessage && (
                        <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
                            {unlockMessage}
                        </p>
                    )}
                </header>

                {/* Main Content */}
                <main className={styles.main}>
                    {/* Order Summary Card */}
                    <section className={styles.card}>
                        <div className={styles.orderSummary}>
                            {/* Book Cover */}
                            <div className={styles.bookCover}>
                                {order?.thumbnailUrl ? (
                                    <img
                                        src={order.thumbnailUrl}
                                        alt={order.bookTitle || 'Book cover'}
                                        className={styles.bookCoverImage}
                                    />
                                ) : (
                                    <div className={styles.bookCoverImage} style={{
                                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#6b7280' }}>auto_stories</span>
                                    </div>
                                )}
                                <div className={styles.bookCoverSpine} />
                            </div>

                            {/* Order Info */}
                            <div className={styles.orderInfo}>
                                <div className={styles.orderBadge}>
                                    ORDER #KBC-{shortOrderId}
                                </div>
                                <h3 className={styles.bookTitle}>
                                    {order?.bookTitle || 'Your Custom Book'}
                                </h3>
                                {formatLabel && (
                                    <p className={styles.bookFormat}>{formatLabel}</p>
                                )}
                                <div className={styles.bookPages}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_stories</span>
                                    <span>{pageCount} Pages</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Shipping Info Card */}
                    <section className={styles.card}>
                        <div className={styles.shippingCard}>
                            <div className={styles.shippingTop}>
                                <div className={styles.shippingIconWrapper}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_shipping</span>
                                </div>
                                <div>
                                    <p className={styles.shippingLabel}>Estimated Arrival</p>
                                    <p className={styles.shippingDate}>{estimatedDelivery}</p>
                                </div>
                            </div>
                            {addr && (addr.line1 || addr.city) && (
                                <div className={styles.addressRow}>
                                    <span className={`material-symbols-outlined ${styles.addressIcon}`} style={{ fontSize: '20px' }}>location_on</span>
                                    <div className={styles.addressText}>
                                        <p>{addr.name || 'Shipping to Home'}</p>
                                        {addr.line1 && <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>}
                                        {addr.city && (
                                            <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode || ''}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Digital Access Card */}
                    {order?.bookId && (
                        <section className={styles.digitalCard}>
                            <div className={styles.digitalBgIcon}>
                                <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>menu_book</span>
                            </div>
                            <div className={styles.digitalContent}>
                                <div className={styles.digitalHeader}>
                                    <span className={`material-symbols-outlined ${styles.digitalPulse}`} style={{ fontSize: '20px' }}>colors_spark</span>
                                    <h3 className={styles.digitalTitle}>Your book is ready!</h3>
                                </div>
                                <p className={styles.digitalDescription}>
                                    While the ink dries, enjoy immediate access to the digital version of {childName ? `${childName}'s` : 'your'} adventure.
                                </p>
                                <Link href={`/book/${order.bookId}`} className={styles.digitalBtn}>
                                    <span>View Digital Book</span>
                                    <span className={`material-symbols-outlined ${styles.digitalBtnArrow}`} style={{ fontSize: '20px' }}>arrow_forward</span>
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Timeline */}
                    <section className={styles.timelineSection}>
                        <h3 className={styles.timelineTitle}>Track Order</h3>
                        <div className={styles.timeline}>
                            {timelineSteps.map((step, i) => {
                                const isDone = i < timelineStep;
                                const isActive = i === timelineStep;
                                const isPending = i > timelineStep;

                                return (
                                    <div
                                        key={step.label}
                                        className={`${styles.timelineStep} ${isPending ? styles.timelineStepPending : ''}`}
                                    >
                                        <div className={`${styles.timelineDot} ${isDone ? styles.timelineDotDone : isActive ? styles.timelineDotActive : styles.timelineDotPending}`}>
                                            <span className={`material-symbols-outlined ${styles.timelineDotIcon} ${isDone ? styles.timelineDotIconDone : isActive ? styles.timelineDotIconActive : styles.timelineDotIconPending}`}>
                                                {isDone ? 'check' : step.icon}
                                            </span>
                                        </div>
                                        <div className={styles.timelineText}>
                                            <p className={styles.timelineStepLabel}>{step.label}</p>
                                            {step.meta && (
                                                <p className={`${styles.timelineStepMeta} ${isActive ? styles.timelineStepMetaActive : ''}`}>
                                                    {step.meta}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>

                {/* Sticky Footer */}
                <div className={styles.stickyFooter}>
                    <Link href="/mybooks" className={styles.viewBooksBtn}>
                        View My Books
                    </Link>
                    <Link href="/create" className={styles.orderAnotherLink}>
                        Order Another Copy
                    </Link>
                </div>
            </div>
        </div>
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
