'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { createClientModuleLogger } from '@/lib/client-logger';
import styles from './page.module.css';

const logger = createClientModuleLogger('admin');

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalBooks: number;
    recentOrders: number;
    monthlyRevenue: number;
    ordersByStatus: Record<string, number>;
}

interface Order {
    id: string;
    status: string;
    total: number;
    format: string;
    size: string;
    quantity: number;
    created_at: string;
    books: { title: string; child_name: string } | null;
    profiles: { email: string; full_name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    paid: '#6366f1',
    processing: '#8b5cf6',
    printed: '#06b6d4',
    shipped: '#10b981',
    delivered: '#22c55e',
    cancelled: '#ef4444',
};

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            checkAdminAndLoad();
        }
    }, [user, authLoading, router]);

    const checkAdminAndLoad = async () => {
        try {
            // Try to fetch admin stats - will 403 if not admin
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.status === 403) {
                router.push('/');
                return;
            }
            if (!statsRes.ok) throw new Error('Failed to load stats');

            setIsAdmin(true);
            const statsData = await statsRes.json();
            setStats(statsData);

            // Fetch recent orders
            const ordersRes = await fetch('/api/admin/orders?limit=10');
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData.orders);
            }
        } catch (error) {
            logger.error({ err: error }, 'Admin load error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (cents: number) => `$${cents.toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.logo}>📚 KidBook</Link>
                    <h1>Admin Dashboard</h1>
                </div>
                <nav className={styles.nav}>
                    <Link href="/admin" className={styles.navActive}>Dashboard</Link>
                    <Link href="/admin/orders" className={styles.navLink}>Orders</Link>
                </nav>
            </header>

            <div className={styles.container}>
                {/* Stats Cards */}
                <section className={styles.statsGrid}>
                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className={styles.statIcon}>📦</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats?.totalOrders || 0}</span>
                            <span className={styles.statLabel}>Total Orders</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span className={styles.statIcon}>💰</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{formatCurrency(stats?.totalRevenue || 0)}</span>
                            <span className={styles.statLabel}>Total Revenue</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className={styles.statIcon}>👥</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats?.totalUsers || 0}</span>
                            <span className={styles.statLabel}>Total Users</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className={styles.statIcon}>📚</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats?.totalBooks || 0}</span>
                            <span className={styles.statLabel}>Books Created</span>
                        </div>
                    </motion.div>
                </section>

                {/* Quick Stats */}
                <section className={styles.quickStats}>
                    <div className={styles.quickStatCard}>
                        <h3>This Week</h3>
                        <span className={styles.quickStatValue}>{stats?.recentOrders || 0} orders</span>
                    </div>
                    <div className={styles.quickStatCard}>
                        <h3>This Month</h3>
                        <span className={styles.quickStatValue}>{formatCurrency(stats?.monthlyRevenue || 0)}</span>
                    </div>
                </section>

                {/* Orders by Status */}
                {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 && (
                    <section className={styles.statusSection}>
                        <h2>Orders by Status</h2>
                        <div className={styles.statusGrid}>
                            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                                <div
                                    key={status}
                                    className={styles.statusCard}
                                    style={{ borderLeftColor: STATUS_COLORS[status] || '#64748b' }}
                                >
                                    <span className={styles.statusCount}>{count}</span>
                                    <span className={styles.statusName}>{status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recent Orders */}
                <section className={styles.ordersSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Orders</h2>
                        <Link href="/admin/orders" className={styles.viewAllBtn}>
                            View All →
                        </Link>
                    </div>

                    <div className={styles.ordersTable}>
                        <div className={styles.tableHeader}>
                            <span>Order</span>
                            <span>Customer</span>
                            <span>Book</span>
                            <span>Total</span>
                            <span>Status</span>
                            <span>Date</span>
                        </div>

                        {orders.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/admin/orders/${order.id}`}
                                    className={styles.tableRow}
                                >
                                    <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                                    <span>{order.profiles?.full_name || order.profiles?.email || 'Unknown'}</span>
                                    <span>{order.books?.title || 'N/A'}</span>
                                    <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                                    <span
                                        className={styles.statusBadge}
                                        style={{
                                            backgroundColor: `${STATUS_COLORS[order.status]}20`,
                                            color: STATUS_COLORS[order.status]
                                        }}
                                    >
                                        {order.status}
                                    </span>
                                    <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
