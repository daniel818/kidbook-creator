'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { createClientModuleLogger } from '@/lib/client-logger';
import styles from './page.module.css';

const logger = createClientModuleLogger('admin-order-detail');

interface Order {
    id: string;
    status: string;
    format: string;
    size: string;
    quantity: number;
    subtotal: number;
    shipping_cost: number;
    total: number;
    tracking_number: string | null;
    lulu_order_id: string | null;
    shipping_full_name: string;
    shipping_address_line1: string;
    shipping_address_line2: string | null;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
    shipping_country: string;
    shipping_phone: string;
    created_at: string;
    updated_at: string;
    books: {
        id: string;
        title: string;
        child_name: string;
        book_type: string;
        book_theme: string;
    } | null;
    profiles: {
        email: string;
        full_name: string;
    } | null;
}

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    paid: '#6366f1',
    processing: '#8b5cf6',
    printed: '#06b6d4',
    shipped: '#10b981',
    delivered: '#22c55e',
    cancelled: '#ef4444',
};

export default function AdminOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;
    const { user, isLoading: authLoading } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user && orderId) {
            loadOrder();
        }
    }, [user, authLoading, router, orderId]);

    const loadOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`);
            if (res.status === 403) {
                router.push('/');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setNewStatus(data.status);
                setTrackingNumber(data.tracking_number || '');
            }
        } catch (error) {
            logger.error({ err: error }, 'Error loading order');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!order) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    trackingNumber: trackingNumber || undefined,
                    sendEmail,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setOrder({ ...order, ...updated });
                setMessage({ type: 'success', text: 'Order updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update order' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.loading}>
                <p>Order not found</p>
                <Link href="/admin/orders">← Back to Orders</Link>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/admin/orders" className={styles.backBtn}>← Back</Link>
                    <h1>Order #{order.id.slice(0, 8)}</h1>
                    <span
                        className={styles.statusBadge}
                        style={{
                            backgroundColor: `${STATUS_COLORS[order.status]}20`,
                            color: STATUS_COLORS[order.status]
                        }}
                    >
                        {order.status}
                    </span>
                </div>
                <span className={styles.date}>Created: {formatDate(order.created_at)}</span>
            </header>

            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Left Column */}
                    <div className={styles.leftColumn}>
                        {/* Customer Info */}
                        <section className={styles.card}>
                            <h2>👤 Customer</h2>
                            <div className={styles.infoGrid}>
                                <div>
                                    <span className={styles.label}>Name</span>
                                    <span>{order.profiles?.full_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className={styles.label}>Email</span>
                                    <span>{order.profiles?.email}</span>
                                </div>
                            </div>
                        </section>

                        {/* Book Info */}
                        <section className={styles.card}>
                            <h2>📚 Book</h2>
                            <div className={styles.bookInfo}>
                                <div className={styles.bookPreview}>📖</div>
                                <div>
                                    <h3>{order.books?.title || 'Untitled'}</h3>
                                    <p>For {order.books?.child_name || 'N/A'}</p>
                                    <p>{order.books?.book_type} · {order.books?.book_theme}</p>
                                </div>
                            </div>
                        </section>

                        {/* Order Details */}
                        <section className={styles.card}>
                            <h2>📦 Order Details</h2>
                            <div className={styles.infoGrid}>
                                <div>
                                    <span className={styles.label}>Format</span>
                                    <span>{order.format}</span>
                                </div>
                                <div>
                                    <span className={styles.label}>Size</span>
                                    <span>{order.size}</span>
                                </div>
                                <div>
                                    <span className={styles.label}>Quantity</span>
                                    <span>×{order.quantity}</span>
                                </div>
                            </div>
                            <div className={styles.pricing}>
                                <div><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
                                <div><span>Shipping</span><span>${order.shipping_cost.toFixed(2)}</span></div>
                                <div className={styles.total}><span>Total</span><span>${order.total.toFixed(2)}</span></div>
                            </div>
                        </section>

                        {/* Shipping Address */}
                        <section className={styles.card}>
                            <h2>📍 Shipping Address</h2>
                            <address className={styles.address}>
                                {order.shipping_full_name}<br />
                                {order.shipping_address_line1}<br />
                                {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
                                {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}<br />
                                {order.shipping_country}<br />
                                <span className={styles.phone}>📞 {order.shipping_phone}</span>
                            </address>
                        </section>
                    </div>

                    {/* Right Column - Actions */}
                    <div className={styles.rightColumn}>
                        <section className={styles.card}>
                            <h2>⚙️ Update Order</h2>

                            {message && (
                                <div className={`${styles.message} ${styles[message.type]}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className={styles.select}
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tracking Number</label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Enter tracking number"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    id="sendEmail"
                                    checked={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.checked)}
                                />
                                <label htmlFor="sendEmail">
                                    Send email notification to customer
                                </label>
                            </div>

                            <button
                                className={styles.saveBtn}
                                onClick={handleUpdate}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Update Order'}
                            </button>
                        </section>

                        {/* External IDs */}
                        <section className={styles.card}>
                            <h2>🔗 External IDs</h2>
                            <div className={styles.externalIds}>
                                <div>
                                    <span className={styles.label}>Tracking</span>
                                    <span>{order.tracking_number || '—'}</span>
                                </div>
                                <div>
                                    <span className={styles.label}>Lulu Order</span>
                                    <span>{order.lulu_order_id || '—'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className={styles.card}>
                            <h2>📅 Timeline</h2>
                            <div className={styles.timeline}>
                                <div className={styles.timelineItem}>
                                    <span className={styles.timelineDot}></span>
                                    <div>
                                        <span>Order Created</span>
                                        <span className={styles.timelineDate}>{formatDate(order.created_at)}</span>
                                    </div>
                                </div>
                                <div className={styles.timelineItem}>
                                    <span className={styles.timelineDot}></span>
                                    <div>
                                        <span>Last Updated</span>
                                        <span className={styles.timelineDate}>{formatDate(order.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
