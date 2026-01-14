'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
    id: string;
    status: string;
    total: number;
    format: string;
    size: string;
    quantity: number;
    created_at: string;
    tracking_number: string | null;
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

const STATUS_OPTIONS = ['all', 'pending', 'paid', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            loadOrders();
        }
    }, [user, authLoading, router, statusFilter]);

    const loadOrders = async () => {
        try {
            const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
            if (res.status === 403) {
                router.push('/');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUpdate = async (newStatus: string) => {
        if (selectedOrders.size === 0) return;

        for (const orderId of selectedOrders) {
            await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        }

        setSelectedOrders(new Set());
        loadOrders();
    };

    const toggleSelect = (orderId: string) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    const selectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(orders.map(o => o.id)));
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

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
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.logo}>📚 KidBook</Link>
                    <h1>Orders Management</h1>
                </div>
                <nav className={styles.nav}>
                    <Link href="/admin" className={styles.navLink}>Dashboard</Link>
                    <Link href="/admin/orders" className={styles.navActive}>Orders</Link>
                </nav>
            </header>

            <div className={styles.container}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.filters}>
                        <label>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
                            ))}
                        </select>
                    </div>

                    {selectedOrders.size > 0 && (
                        <div className={styles.bulkActions}>
                            <span>{selectedOrders.size} selected</span>
                            <select
                                onChange={(e) => { handleBulkUpdate(e.target.value); e.target.value = ''; }}
                                className={styles.bulkSelect}
                                defaultValue=""
                            >
                                <option value="" disabled>Update Status...</option>
                                {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Orders Table */}
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.size === orders.length && orders.length > 0}
                                        onChange={selectAll}
                                    />
                                </th>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Book</th>
                                <th>Details</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.has(order.id)}
                                            onChange={() => toggleSelect(order.id)}
                                        />
                                    </td>
                                    <td className={styles.orderId}>#{order.id.slice(0, 8)}</td>
                                    <td>
                                        <div className={styles.customerCell}>
                                            <span>{order.profiles?.full_name || 'Unknown'}</span>
                                            <span className={styles.email}>{order.profiles?.email}</span>
                                        </div>
                                    </td>
                                    <td>{order.books?.title || 'N/A'}</td>
                                    <td className={styles.details}>
                                        {order.format} · {order.size} · ×{order.quantity}
                                    </td>
                                    <td className={styles.total}>${order.total.toFixed(2)}</td>
                                    <td>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: `${STATUS_COLORS[order.status]}20`,
                                                color: STATUS_COLORS[order.status]
                                            }}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className={styles.date}>{formatDate(order.created_at)}</td>
                                    <td>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className={styles.viewBtn}
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No orders found</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
