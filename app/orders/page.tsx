'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
    id: string;
    bookId: string;
    bookTitle: string;
    childName: string;
    format: string;
    size: string;
    quantity: number;
    total: number;
    status: string;
    trackingNumber: string | null;
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
    paid: { label: 'Paid', color: '#6366f1', icon: '✓' },
    processing: { label: 'Processing', color: '#8b5cf6', icon: '⚙️' },
    printed: { label: 'Printed', color: '#06b6d4', icon: '📖' },
    shipped: { label: 'Shipped', color: '#10b981', icon: '📦' },
    delivered: { label: 'Delivered', color: '#22c55e', icon: '✅' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✕' },
};

export default function OrdersPage() {
    const router = useRouter();
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
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    ← Back to Home
                </Link>
                <h1 className={styles.headerTitle}>My Orders</h1>
                <div className={styles.placeholder}></div>
            </header>

            <div className={styles.container}>
                {orders.length === 0 ? (
                    <motion.div
                        className={styles.emptyState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className={styles.emptyIcon}>📦</span>
                        <h2>No Orders Yet</h2>
                        <p>When you order a printed book, it will appear here.</p>
                        <Link href="/create" className={styles.createBtn}>
                            Create Your First Book →
                        </Link>
                    </motion.div>
                ) : (
                    <div className={styles.ordersList}>
                        {orders.map((order, index) => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

                            return (
                                <motion.div
                                    key={order.id}
                                    className={styles.orderCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className={styles.orderHeader}>
                                        <div className={styles.orderInfo}>
                                            <span className={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
                                            <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                                        </div>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: `${status.color}20`, color: status.color }}
                                        >
                                            {status.icon} {status.label}
                                        </span>
                                    </div>

                                    <div className={styles.orderContent}>
                                        <div className={styles.bookInfo}>
                                            <span className={styles.bookIcon}>📚</span>
                                            <div>
                                                <h3>{order.bookTitle}</h3>
                                                <p>For {order.childName}</p>
                                            </div>
                                        </div>

                                        <div className={styles.orderDetails}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>Format</span>
                                                <span className={styles.detailValue}>
                                                    {order.format} - {order.size}
                                                </span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>Quantity</span>
                                                <span className={styles.detailValue}>×{order.quantity}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>Total</span>
                                                <span className={styles.detailValue}>${order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {order.trackingNumber && (
                                        <div className={styles.trackingSection}>
                                            <span className={styles.trackingIcon}>🚚</span>
                                            <div>
                                                <span className={styles.trackingLabel}>Tracking Number</span>
                                                <a
                                                    href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.trackingNumber}
                                                >
                                                    {order.trackingNumber}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.orderActions}>
                                        {order.bookId && (
                                            <Link
                                                href={`/create/${order.bookId}`}
                                                className={styles.viewBookBtn}
                                            >
                                                View Book
                                            </Link>
                                        )}
                                        {order.status === 'delivered' && (
                                            <button className={styles.reorderBtn}>
                                                Order Again
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
