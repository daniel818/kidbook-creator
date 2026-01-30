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

// Progress steps for the timeline
const PROGRESS_STEPS = [
    { key: 'ordered', label: 'Ordered', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'preparing', label: 'Preparing', icon: '⏰' },
    { key: 'printing', label: 'Printing', icon: '📖' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
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

    if (authLoading || (isLoading && !orders.length)) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{t('header.title') || 'My Orders'}</h1>
                        <p className={styles.subtitle}>{t('header.subtitle') || 'Track your printed books'}</p>
                    </div>

                    {orders.length === 0 ? (
                        <motion.div
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className={styles.emptyState}>
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
                            </div>
                        </motion.div>
                    ) : (
                        <div className={styles.orderGrid}>
                            {orders.map((order, index) => {
                                const config = getStatusConfig(order.status, order.fulfillmentStatus);
                                const isError = config.step === 0;

                                return (
                                    <motion.div
                                        key={order.id}
                                        className={styles.orderCard}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className={styles.orderHeader}>
                                            <div className={styles.orderId}>ORDER #{order.id.slice(0, 8).toUpperCase()}</div>
                                            <div>{formatDate(order.createdAt)}</div>
                                        </div>

                                        <div className={styles.orderContent}>
                                            {order.bookThumbnail ? (
                                                <img
                                                    src={order.bookThumbnail}
                                                    alt={order.bookTitle}
                                                    className={styles.bookCoverImage}
                                                />
                                            ) : (
                                                <div
                                                    className={styles.bookCover}
                                                    style={{ backgroundColor: getThemeColor(order.bookTheme) }}
                                                >
                                                    📚
                                                </div>
                                            )}
                                            <div className={styles.orderDetails}>
                                                <div className={styles.titleRow}>
                                                    <h3 className={styles.bookTitle}>{order.bookTitle}</h3>
                                                    <span
                                                        className={styles.orderStatus}
                                                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                                    >
                                                        {config.icon} {config.label}
                                                    </span>
                                                </div>
                                                {order.childName && (
                                                    <div className={styles.bookMeta}>For {order.childName}</div>
                                                )}
                                                <div className={styles.metaRow}>
                                                    <span className={styles.metaPill}>{formatLabel(order.format)}</span>
                                                    <span className={styles.metaPill}>{SIZE_LABELS[order.size] || order.size}</span>
                                                    <span className={styles.metaPill}>Qty {order.quantity}</span>
                                                </div>
                                                <div className={styles.statusRow}>
                                                    {formatDeliveryRange(order.estimatedDeliveryMin, order.estimatedDeliveryMax) && (
                                                        <span className={styles.deliveryBadge}>
                                                            <span className={styles.deliveryIcon}>📦</span>
                                                            {formatDeliveryRange(order.estimatedDeliveryMin, order.estimatedDeliveryMax)}
                                                        </span>
                                                    )}
                                                </div>

                                                {!isError && (
                                                    <div className={styles.progressTimeline}>
                                                        {PROGRESS_STEPS.map((step, i) => {
                                                            const isCompleted = config.step > i + 1;
                                                            const isCurrent = config.step === i + 1;
                                                            return (
                                                                <div
                                                                    key={step.key}
                                                                    className={`${styles.progressStep} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                                                                >
                                                                    <div className={styles.progressDot}>
                                                                        {isCompleted ? '✓' : isCurrent ? step.icon : (i + 1)}
                                                                    </div>
                                                                    <span className={styles.progressLabel}>{step.label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.orderFooter}>
                                            <div className={styles.orderTotal}>
                                                ${order.total.toFixed(2)}
                                                <span className={styles.totalLabel}>Paid</span>
                                            </div>
                                            <div className={styles.orderActions}>
                                                {(order.trackingUrl || order.trackingNumber) && (
                                                    <a
                                                        href={order.trackingUrl || order.trackingNumber}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.trackButton}
                                                    >
                                                        {order.carrierName ? `Track ${order.carrierName}` : 'Track Package'}
                                                    </a>
                                                )}
                                                {order.bookId && (
                                                    <Link href={`/book/${order.bookId}`} className={styles.viewBookBtn}>
                                                        View Book
                                                    </Link>
                                                )}
                                                {isError && (
                                                    <a
                                                        href="mailto:support@kidbook-creator.com"
                                                        className={styles.supportButton}
                                                    >
                                                        Contact Support
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
