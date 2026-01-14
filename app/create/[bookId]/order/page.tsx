'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Book, BookTypeInfo, BookThemeInfo } from '@/lib/types';
import { getBookById } from '@/lib/storage';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStripe } from '@/lib/stripe/client';
import styles from './page.module.css';

type BookFormat = 'softcover' | 'hardcover';
type BookSize = '6x6' | '8x8' | '8x10';

interface PriceInfo {
    basePrice: number;
    perPage: number;
}

const PRICING: Record<BookFormat, Record<BookSize, PriceInfo>> = {
    softcover: {
        '6x6': { basePrice: 8.99, perPage: 0.35 },
        '8x8': { basePrice: 12.99, perPage: 0.45 },
        '8x10': { basePrice: 14.99, perPage: 0.55 }
    },
    hardcover: {
        '6x6': { basePrice: 18.99, perPage: 0.45 },
        '8x8': { basePrice: 24.99, perPage: 0.55 },
        '8x10': { basePrice: 29.99, perPage: 0.65 }
    }
};

const SIZE_LABELS: Record<BookSize, string> = {
    '6x6': '6" × 6" (Small Square)',
    '8x8': '8" × 8" (Medium Square)',
    '8x10': '8" × 10" (Large Portrait)'
};

export default function OrderPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;
    const { user } = useAuth();

    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [format, setFormat] = useState<BookFormat>('softcover');
    const [size, setSize] = useState<BookSize>('8x8');
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<'options' | 'shipping' | 'payment'>('options');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Shipping form
    const [shipping, setShipping] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        phone: ''
    });

    useEffect(() => {
        const loadedBook = getBookById(bookId);
        if (loadedBook) {
            setBook(loadedBook);
        } else {
            router.push('/');
        }
        setIsLoading(false);
    }, [bookId, router]);

    const calculatePrice = () => {
        if (!book) return 0;
        const pricing = PRICING[format][size];
        const pagePrice = book.pages.length * pricing.perPage;
        return (pricing.basePrice + pagePrice) * quantity;
    };

    const totalPrice = calculatePrice();
    const shippingCost = 4.99;
    const grandTotal = totalPrice + shippingCost;

    const isShippingValid = () => {
        return shipping.fullName &&
            shipping.addressLine1 &&
            shipping.city &&
            shipping.state &&
            shipping.postalCode &&
            shipping.phone;
    };

    const handleCheckout = async () => {
        if (!user) {
            setError('Please sign in to complete your order');
            return;
        }

        if (!agreedToTerms) {
            setError('Please agree to the Terms of Service');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            // Create Stripe checkout session
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    format,
                    size,
                    quantity,
                    shipping,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe Checkout
            const stripe = await getStripe();
            if (stripe && data.sessionId) {
                const { error: stripeError } = await stripe.redirectToCheckout({
                    sessionId: data.sessionId,
                });

                if (stripeError) {
                    throw new Error(stripeError.message);
                }
            } else if (data.url) {
                // Fallback to direct URL redirect
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
            setIsProcessing(false);
        }
    };

    if (isLoading || !book) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading order details...</p>
            </div>
        );
    }

    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme].colors
        : ['#6366f1', '#ec4899'];

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push(`/create/${bookId}`)}
                >
                    ← Back to Editor
                </button>
                <h1 className={styles.headerTitle}>Order Your Book</h1>
                <div className={styles.placeholder}></div>
            </header>

            <div className={styles.orderLayout}>
                {/* Left - Options */}
                <div className={styles.optionsSection}>
                    {/* Step Indicator */}
                    <div className={styles.steps}>
                        {['options', 'shipping', 'payment'].map((s, i) => (
                            <div
                                key={s}
                                className={`${styles.stepIndicator} ${step === s ? styles.active : ''} ${(s === 'shipping' && step === 'payment') ||
                                    (s === 'options' && (step === 'shipping' || step === 'payment'))
                                    ? styles.completed : ''
                                    }`}
                            >
                                <span className={styles.stepNumber}>{i + 1}</span>
                                <span className={styles.stepLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Options Step */}
                    {step === 'options' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.stepContent}
                        >
                            <h2 className={styles.sectionTitle}>Choose Your Format</h2>

                            <div className={styles.formatGrid}>
                                {(['softcover', 'hardcover'] as BookFormat[]).map(f => (
                                    <button
                                        key={f}
                                        className={`${styles.formatCard} ${format === f ? styles.selected : ''}`}
                                        onClick={() => setFormat(f)}
                                    >
                                        <span className={styles.formatIcon}>
                                            {f === 'softcover' ? '📄' : '📕'}
                                        </span>
                                        <span className={styles.formatName}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </span>
                                        <span className={styles.formatDesc}>
                                            {f === 'softcover'
                                                ? 'Flexible, lightweight cover'
                                                : 'Premium, durable hardback'
                                            }
                                        </span>
                                        <span className={styles.formatPrice}>
                                            from ${PRICING[f]['6x6'].basePrice}
                                        </span>
                                        {format === f && <span className={styles.checkmark}>✓</span>}
                                    </button>
                                ))}
                            </div>

                            <h2 className={styles.sectionTitle}>Select Size</h2>

                            <div className={styles.sizeGrid}>
                                {(Object.keys(SIZE_LABELS) as BookSize[]).map(s => (
                                    <button
                                        key={s}
                                        className={`${styles.sizeCard} ${size === s ? styles.selected : ''}`}
                                        onClick={() => setSize(s)}
                                    >
                                        <span className={styles.sizePreview}>
                                            <span
                                                className={styles.sizeBox}
                                                style={{
                                                    width: s === '6x6' ? '40px' : s === '8x8' ? '50px' : '50px',
                                                    height: s === '6x6' ? '40px' : s === '8x8' ? '50px' : '62px'
                                                }}
                                            ></span>
                                        </span>
                                        <span className={styles.sizeName}>{SIZE_LABELS[s]}</span>
                                        {size === s && <span className={styles.checkmark}>✓</span>}
                                    </button>
                                ))}
                            </div>

                            <h2 className={styles.sectionTitle}>Quantity</h2>

                            <div className={styles.quantitySelector}>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <span className={styles.qtyValue}>{quantity}</span>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                className={styles.continueBtn}
                                onClick={() => setStep('shipping')}
                            >
                                Continue to Shipping →
                            </button>
                        </motion.div>
                    )}

                    {/* Shipping Step */}
                    {step === 'shipping' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.stepContent}
                        >
                            <h2 className={styles.sectionTitle}>Shipping Address</h2>

                            <div className={styles.shippingForm}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={shipping.fullName}
                                            onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Address Line 1 *</label>
                                        <input
                                            type="text"
                                            value={shipping.addressLine1}
                                            onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                                            placeholder="123 Main Street"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Address Line 2</label>
                                        <input
                                            type="text"
                                            value={shipping.addressLine2}
                                            onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                                            placeholder="Apt 4B (optional)"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>City *</label>
                                        <input
                                            type="text"
                                            value={shipping.city}
                                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                            placeholder="New York"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State *</label>
                                        <input
                                            type="text"
                                            value={shipping.state}
                                            onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                            placeholder="NY"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Postal Code *</label>
                                        <input
                                            type="text"
                                            value={shipping.postalCode}
                                            onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                                            placeholder="10001"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Country</label>
                                        <select
                                            value={shipping.country}
                                            onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                                        >
                                            <option>United States</option>
                                            <option>Canada</option>
                                            <option>United Kingdom</option>
                                            <option>Australia</option>
                                            <option>Germany</option>
                                            <option>France</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={shipping.phone}
                                            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <button
                                    className={styles.backBtn}
                                    onClick={() => setStep('options')}
                                >
                                    ← Back
                                </button>
                                <button
                                    className={styles.continueBtn}
                                    onClick={() => setStep('payment')}
                                    disabled={!isShippingValid()}
                                >
                                    Continue to Payment →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Payment Step */}
                    {step === 'payment' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.stepContent}
                        >
                            <h2 className={styles.sectionTitle}>Payment</h2>

                            {!user && (
                                <div className={styles.loginNotice}>
                                    <span>🔐</span>
                                    <p>Please sign in to complete your order. Your book will be saved to your account.</p>
                                </div>
                            )}

                            <div className={styles.paymentBox}>
                                <div className={styles.paymentIcon}>💳</div>
                                <h3>Secure Checkout</h3>
                                <p>
                                    You&apos;ll be redirected to Stripe&apos;s secure payment page to complete your order.
                                </p>

                                <div className={styles.securityBadges}>
                                    <span>🔒 SSL Encrypted</span>
                                    <span>✓ PCI Compliant</span>
                                </div>
                            </div>

                            <div className={styles.termsBox}>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    />
                                    <span>I agree to the Terms of Service and Privacy Policy</span>
                                </label>
                            </div>

                            {error && (
                                <div className={styles.errorBox}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className={styles.buttonRow}>
                                <button
                                    className={styles.backBtn}
                                    onClick={() => setStep('shipping')}
                                    disabled={isProcessing}
                                >
                                    ← Back
                                </button>
                                <button
                                    className={styles.payBtn}
                                    onClick={handleCheckout}
                                    disabled={isProcessing || !user}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className={styles.btnSpinner}></span>
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay $${grandTotal.toFixed(2)} →`
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right - Order Summary */}
                <aside className={styles.summarySection}>
                    <div className={styles.summaryCard}>
                        <h2 className={styles.summaryTitle}>Order Summary</h2>

                        {/* Book Preview */}
                        <div className={styles.bookPreview}>
                            <div
                                className={styles.bookCover}
                                style={{
                                    background: `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                }}
                            >
                                <span className={styles.bookEmoji}>
                                    {BookTypeInfo[book.settings.bookType].icon}
                                </span>
                            </div>
                            <div className={styles.bookDetails}>
                                <h3>{book.settings.title}</h3>
                                <p>For {book.settings.childName}, age {book.settings.childAge}</p>
                                <p>{book.pages.length} pages</p>
                            </div>
                        </div>

                        {/* Selected Options */}
                        <div className={styles.selectedOptions}>
                            <div className={styles.optionRow}>
                                <span>Format</span>
                                <span>{format.charAt(0).toUpperCase() + format.slice(1)}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>Size</span>
                                <span>{size}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>Quantity</span>
                                <span>×{quantity}</span>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className={styles.pricing}>
                            <div className={styles.priceRow}>
                                <span>Subtotal</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <div className={styles.priceRow}>
                                <span>Shipping</span>
                                <span>${shippingCost.toFixed(2)}</span>
                            </div>
                            <div className={`${styles.priceRow} ${styles.total}`}>
                                <span>Total</span>
                                <span>${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Delivery Estimate */}
                        <div className={styles.deliveryBox}>
                            <span className={styles.deliveryIcon}>📦</span>
                            <div>
                                <strong>Estimated Delivery</strong>
                                <p>5-10 business days</p>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className={styles.trustBadges}>
                            <div className={styles.badge}>
                                <span>✨</span>
                                <span>Premium Quality</span>
                            </div>
                            <div className={styles.badge}>
                                <span>🌱</span>
                                <span>Eco-Friendly</span>
                            </div>
                            <div className={styles.badge}>
                                <span>💯</span>
                                <span>Satisfaction Guaranteed</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
