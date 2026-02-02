'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import styles from './orders.module.css';

interface Order {
    id: string;
    bookId: string;
    bookTitle: string;
    bookThumbnail?: string;
    bookTheme?: string;
    childName: string;
    format: string;
    size: string;
    quantity: number;
    total: number;
    status: string;
    fulfillmentStatus?: string;
    luluStatus?: string;
    createdAt: string;
    trackingNumber?: string;
    trackingUrl?: string;
    carrierName?: string;
    estimatedDeliveryMin?: string;
    estimatedDeliveryMax?: string;
}

// Map internal status to user-friendly display
const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; step: number }> = {
    // Payment statuses
    'pending': { label: 'Order Placed', icon: '⏳', color: '#f59e0b', step: 1 },
    'paid': { label: 'Payment Confirmed', icon: '✓', color: '#6366f1', step: 2 },
    // Fulfillment statuses
    'processing': { label: 'Processing', icon: '⚙️', color: '#8b5cf6', step: 2 },
    'preparing': { label: 'Preparing to Print', icon: '⏰', color: '#8b5cf6', step: 3 },
    'printing': { label: 'Printing Your Book', icon: '📖', color: '#06b6d4', step: 4 },
    'shipped': { label: 'Shipped', icon: '🚚', color: '#10b981', step: 5 },
    'delivered': { label: 'Delivered', icon: '🎉', color: '#22c55e', step: 6 },
    'cancelled': { label: 'Cancelled', icon: '❌', color: '#ef4444', step: 0 },
    'failed': { label: 'Issue Detected', icon: '⚠️', color: '#ef4444', step: 0 },
    // Legacy/internal statuses
    'SUCCESS': { label: 'Processing', icon: '⚙️', color: '#8b5cf6', step: 2 },
    'CREATING_JOB': { label: 'Creating Order', icon: '⏳', color: '#8b5cf6', step: 2 },
    'UPLOADING': { label: 'Uploading Files', icon: '📤', color: '#8b5cf6', step: 2 },
    'GENERATING_PDFS': { label: 'Generating Book', icon: '📝', color: '#8b5cf6', step: 2 },
    'PENDING': { label: 'Pending', icon: '⏳', color: '#f59e0b', step: 1 },
    'FAILED': { label: 'Failed', icon: '❌', color: '#ef4444', step: 0 },
};

// Progress steps for the timeline (Stitch layout)
const PROGRESS_STEPS = [
    { key: 'confirmed', label: 'Confirmed', icon: 'check' },
    { key: 'printing', label: 'Printing', icon: 'book_2' },
    { key: 'shipped', label: 'Shipped', icon: 'local_shipping' },
    { key: 'delivered', label: 'Delivered', icon: 'celebration' },
];

const SIZE_LABELS: Record<string, string> = {
    '7.5x7.5': '7.5" × 7.5"',
    '8x8': '8.5" × 8.5"',
    '8x10': '8.5" × 11"',
};

export default function OrdersPage() {
    const router = useRouter();
    const { t } = useTranslation('orders');
    const { user, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusConfig = (status: string, fulfillment?: string) => {
        const displayStatus = fulfillment || status;
        return STATUS_CONFIG[displayStatus] || { label: displayStatus, icon: '', color: '#6b7280', step: 0 };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDeliveryRange = (minDate?: string, maxDate?: string) => {
        if (!minDate && !maxDate) return null;
        const min = minDate ? new Date(minDate) : null;
        const max = maxDate ? new Date(maxDate) : null;
        if ((min && Number.isNaN(min.getTime())) || (max && Number.isNaN(max.getTime()))) {
            return null;
        }

        const formatMonthDay = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const formatMonthDayYear = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (min && max) {
            const sameDay = min.toDateString() === max.toDateString();
            if (sameDay) {
                return `Arrives ${formatMonthDayYear(min)}`;
            }
            const sameYear = min.getFullYear() === max.getFullYear();
            const sameMonth = sameYear && min.getMonth() === max.getMonth();
            if (sameMonth) {
                return `Arrives ${formatMonthDay(min)}–${max.getDate()}, ${min.getFullYear()}`;
            }
            if (sameYear) {
                return `Arrives ${formatMonthDay(min)}–${formatMonthDay(max)}, ${min.getFullYear()}`;
            }
            return `Arrives ${formatMonthDayYear(min)}–${formatMonthDayYear(max)}`;
        }

        const single = min || max;
        return single ? `Arrives ${formatMonthDayYear(single)}` : null;
    };

    const getThemeColor = (theme?: string) => {
        const colors: Record<string, string> = {
            'adventure': '#f97316',
            'fantasy': '#ec4899',
            'animals': '#84cc16',
            'space': '#6366f1',
            'default': '#cbd5e1'
        };
        return colors[theme || 'default'] || colors['default'];
    };

    const formatLabel = (value?: string) => {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const formatOrderId = (id: string) => {
        const cleaned = id.replace(/[^a-z0-9]/gi, '').toUpperCase();
        const suffix = cleaned.slice(-4) || cleaned.slice(0, 4);
        return `KBC-${suffix || '0000'}`;
    };

    const getProgressIndex = (step: number) => {
        if (step >= 6) return 3;
        if (step >= 5) return 2;
        if (step >= 3) return 1;
        return 0;
    };

    const getStatusTone = (label: string, step: number) => {
        const value = label.toLowerCase();
        if (value.includes('fail') || value.includes('cancel') || value.includes('issue')) {
            return { className: styles.statusError, icon: 'error' };
        }
        if (value.includes('ship')) {
            return { className: styles.statusShipped, icon: 'local_shipping' };
        }
        if (value.includes('print')) {
            return { className: styles.statusPrinting, icon: 'print' };
        }
        if (value.includes('deliver')) {
            return { className: styles.statusDelivered, icon: 'task_alt' };
        }
        if (value.includes('process') || value.includes('confirm') || step <= 2) {
            return { className: styles.statusProcessing, icon: 'task_alt' };
        }
        return { className: styles.statusDefault, icon: 'hourglass_top' };
    };

    if (authLoading || (isLoading && !orders.length)) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    const activeCount = orders.filter(order => {
        const config = getStatusConfig(order.status, order.fulfillmentStatus);
        return config.step > 0 && config.step < 6;
    }).length;

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{t('header.title') || 'My Orders'}</h1>
                        <p className={`${styles.subtitle} ${styles.subtitleDesktop}`}>
                            {t('header.subtitle') || 'Manage and track your printed book collection'}
                        </p>
                        <p className={`${styles.subtitle} ${styles.subtitleMobile}`}>
                            {`Tracking ${activeCount} active shipments`}
                        </p>
                    </div>

                    {orders.length === 0 ? (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className={styles.emptyIcon}>📦</span>
                            <p className={styles.emptyText}>{t('empty.title') || 'No orders yet'}</p>
                            <p className={styles.emptySubtext}>
                                {t('empty.subtitle') || 'Create your first custom book and order a printed copy!'}
                            </p>
                            <button
                                className={styles.emptyButton}
                                onClick={() => router.push('/create')}
                            >
                                {t('empty.button') || 'Create a Book'}
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <div className={styles.orderGrid}>
                                {orders.map((order, index) => {
                                    const config = getStatusConfig(order.status, order.fulfillmentStatus);
                                    const progressIndex = getProgressIndex(config.step);
                                    const progressPercent = (progressIndex / (PROGRESS_STEPS.length - 1)) * 100;
                                    const statusTone = getStatusTone(config.label, config.step);
                                    const deliveryRange = formatDeliveryRange(order.estimatedDeliveryMin, order.estimatedDeliveryMax);
                                    const deliveryDisplay = deliveryRange
                                        ? deliveryRange
                                            .replace(/^arrives\\s*/i, '')
                                            .replace(/^delivered\\s*/i, '')
                                            .trim()
                                        : null;
                                    const isDelivered = config.step >= 6;
                                    const isError = config.step === 0;
                                    const mobileStatusLabel = isError
                                        ? config.label
                                        : isDelivered
                                            ? 'Delivered'
                                            : config.step >= 5
                                                ? 'In Transit'
                                                : config.step >= 3
                                                    ? 'Printing'
                                                    : 'Processing';
                                    const deliveryLabel = isDelivered ? 'Delivered on' : 'Est. Delivery';
                                    const deliveryValue = deliveryDisplay || formatDate(order.createdAt);
                                    const canTrack = Boolean(order.trackingUrl || order.trackingNumber);

                                    return (
                                        <motion.div
                                            key={order.id}
                                            className={styles.orderCard}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                        >
                                            <div className={styles.orderTop}>
                                                <div className={styles.orderMeta}>
                                                    <span className={styles.orderId}>{`ORDER #${formatOrderId(order.id)}`}</span>
                                                    <span className={styles.metaDot}></span>
                                                    <span className={styles.orderDate}>
                                                        <span className="material-symbols-outlined">calendar_today</span>
                                                        {formatDate(order.createdAt)}
                                                    </span>
                                                </div>
                                                <span className={`${styles.statusPill} ${statusTone.className}`}>
                                                    <span className="material-symbols-outlined">{statusTone.icon}</span>
                                                    {config.label}
                                                </span>
                                            </div>

                                            <div className={styles.orderBody}>
                                                <div className={styles.bookThumbContainer}>
                                                    <div
                                                        className={styles.bookThumb}
                                                        style={{
                                                            backgroundImage: order.bookThumbnail ? `url(${order.bookThumbnail})` : undefined,
                                                            backgroundColor: order.bookThumbnail ? undefined : getThemeColor(order.bookTheme),
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className={styles.orderDetails}>
                                                    <h3 className={styles.bookTitle}>{order.bookTitle}</h3>
                                                    {order.childName && (
                                                        <p className={styles.childName}>For {order.childName}</p>
                                                    )}
                                                    <div className={styles.formatRow}>
                                                        <span className={styles.formatPill}>{formatLabel(order.format) || 'Hardcover'}</span>
                                                        <span className={styles.formatPill}>{SIZE_LABELS[order.size] || order.size}</span>
                                                        <span className={styles.formatPill}>Qty {order.quantity}</span>
                                                    </div>
                                                    <div className={styles.progressWrap}>
                                                        <div className={styles.progressMeta}>
                                                            <span className={styles.progressStatus}>{mobileStatusLabel}</span>
                                                        </div>
                                                        <div className={styles.progressTrack}></div>
                                                        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                                                        <div className={styles.progressSteps}>
                                                            {PROGRESS_STEPS.map((step, i) => {
                                                                const isCompleted = i < progressIndex;
                                                                const isCurrent = i === progressIndex;
                                                                return (
                                                                    <div
                                                                        key={step.key}
                                                                        className={`${styles.progressStep} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepCurrent : ''}`}
                                                                    >
                                                                        <div className={styles.progressIcon}>
                                                                            <span className="material-symbols-outlined">{step.icon}</span>
                                                                        </div>
                                                                        <span className={styles.progressLabel}>{step.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.orderFooter}>
                                                <div className={styles.footerLeft}>
                                                    <div className={styles.paidInfo}>
                                                        <span className={styles.paidAmount}>${order.total.toFixed(2)}</span>
                                                        <span className={styles.paidLabel}>Paid</span>
                                                    </div>
                                                    <div className={styles.orderActions}>
                                                        {isError ? (
                                                            <a
                                                                className={styles.supportButton}
                                                                href="mailto:support@kidbook-creator.com"
                                                            >
                                                                Contact Support
                                                            </a>
                                                        ) : canTrack ? (
                                                            <a
                                                                className={styles.primaryButton}
                                                                href={order.trackingUrl || order.trackingNumber}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <span className={styles.buttonLabelDesktop}>Track Order</span>
                                                                <span className={styles.buttonLabelMobile}>Track</span>
                                                            </a>
                                                        ) : (
                                                            <button className={`${styles.secondaryButton} ${styles.disabledButton}`} disabled>
                                                                <span className={styles.buttonLabelDesktop}>Track Order</span>
                                                                <span className={styles.buttonLabelMobile}>Track</span>
                                                            </button>
                                                        )}
                                                        {order.bookId && (
                                                            <Link href={`/book/${order.bookId}`} className={styles.secondaryButton}>
                                                                <span className={styles.buttonLabelDesktop}>View Book</span>
                                                                <span className={styles.buttonLabelMobile}>Details</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.estDelivery}>
                                                    <div className={styles.estLabel}>{deliveryLabel}</div>
                                                    <div className={styles.estValue}>{deliveryValue}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className={styles.supportRow}>
                                Have a question about an order? <a href="mailto:support@kidbook-creator.com">Contact Support</a>
                            </div>
                            <div className={styles.mobileExtras}>
                                <p>Showing recent orders from the last 6 months</p>
                                <button className={styles.loadMore}>Load More Orders</button>
                                <div className={styles.supportBox}>
                                    Need help with a specific order? <a href="mailto:support@kidbook-creator.com">Contact Support</a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
