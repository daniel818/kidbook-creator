'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { getPrice, getCurrencyFromLocale, formatPrice, type Currency } from '@/lib/pricing/constants';
import { Book, BookTypeInfo, BookThemeInfo } from '@/lib/types';
import { getBookById } from '@/lib/storage';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStripe } from '@/lib/stripe/client';
import { COUNTRIES } from '@/lib/countries';
import { generateInteriorPDF } from '@/lib/lulu/pdf-generator';
import { generateCoverPDF } from '@/lib/lulu/cover-generator';
import { getPrintableInteriorPageCount } from '@/lib/lulu/page-count';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

type BookFormat = 'softcover' | 'hardcover';
type BookSize = '8x8' | '8x10';
type OrderStep = 'options' | 'shipping' | 'review' | 'payment';

interface ShippingOption {
    id: string;
    level: string;
    currency: string;
    cost_excl_tax?: string;
    min_delivery_date?: string;
    max_delivery_date?: string;
    min_dispatch_date?: string;
    max_dispatch_date?: string;
    home_only?: boolean;
    business_only?: boolean;
    postbox_ok?: boolean;
    traceable?: boolean;
}

function formatShippingCost(option: ShippingOption): string | null {
    if (option.cost_excl_tax === undefined || option.cost_excl_tax === null) return null;
    const amount = typeof option.cost_excl_tax === 'string'
        ? Number(option.cost_excl_tax)
        : option.cost_excl_tax;
    if (Number.isNaN(amount)) return null;
    return `$${amount.toFixed(2)} ${option.currency || 'USD'}`;
}

function formatShippingLevel(level: string): string {
    return level.replace(/_/g, ' ');
}

const SIZE_LABELS: Record<BookSize, string> = {
    '8x8': '8" × 8" (Square)',
    '8x10': '8" × 10" (Novella)'
};

const ALL_SIZES: BookSize[] = ['8x8', '8x10'];
const SIZES_BY_RATIO: Record<'square' | 'portrait', BookSize[]> = {
    square: ['8x8'],
    portrait: ['8x10']
};

function getAvailableSizes(printFormat?: Book['settings']['printFormat']): BookSize[] {
    if (!printFormat) return ALL_SIZES;
    return SIZES_BY_RATIO[printFormat] || ALL_SIZES;
}

export default function OrderPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;
    const { user } = useAuth();
    const { t, i18n } = useTranslation('order');
    const currency: Currency = getCurrencyFromLocale(i18n.language);

    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryType, setDeliveryType] = useState<'digital' | 'print'>('print');
    const [format, setFormat] = useState<BookFormat>('softcover');
    const [size, setSize] = useState<BookSize>('8x8');
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<OrderStep>('options');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Shipping state (pricing is now fixed, not from API)
    const [shippingCost, setShippingCost] = useState<number>(0);

    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [shippingLevel, setShippingLevel] = useState<string>('');
    const [isShippingOptionsLoading, setIsShippingOptionsLoading] = useState(false);
    const [shippingOptionsError, setShippingOptionsError] = useState<string | null>(null);
    const [reviewQuote, setReviewQuote] = useState<{
        bookPrice: number;
        shipping: number;
        total: number;
        format: BookFormat;
        size: BookSize;
        quantity: number;
        shippingLevel: string;
        shippingKey: string;
    } | null>(null);

    // Shipping form
    const [shipping, setShipping] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        phone: ''
    });
    const shippingKey = [
        shipping.fullName,
        shipping.addressLine1,
        shipping.addressLine2,
        shipping.city,
        shipping.state,
        shipping.postalCode,
        shipping.country,
        shipping.phone
    ].join('|');

    // Load book on mount
    useEffect(() => {
        const loadBook = async () => {
            // 1. Try Local Storage
            const localBook = getBookById(bookId);
            if (localBook) {
                setBook(localBook);
                setIsLoading(false);
                return;
            }

            // 2. Try API Fetch (Fallback)
            try {
                const res = await fetch(`/api/books/${bookId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.book) {
                        setBook(data.book);
                    } else {
                        // Handle potential direct return or wrapped
                        setBook(data);
                    }
                } else {
                    console.error("Failed to fetch book from API", res.status);
                    // Use router.replace to avoid history stack issues on redirect
                    router.replace('/mybooks');
                }
            } catch (error) {
                console.error("Error fetching book:", error);
                router.replace('/mybooks');
            } finally {
                setIsLoading(false);
            }
        };

        loadBook();
    }, [bookId, router]);

    useEffect(() => {
        if (!book) return;
        const availableSizes = getAvailableSizes(book.settings.printFormat);
        if (!availableSizes.includes(size)) {
            setSize(availableSizes[0]);
        }
    }, [book, size]);

    useEffect(() => {
        if (!reviewQuote || step === 'review' || step === 'payment') return;
        if (
            reviewQuote.format !== format ||
            reviewQuote.size !== size ||
            reviewQuote.quantity !== quantity ||
            reviewQuote.shippingLevel !== shippingLevel ||
            reviewQuote.shippingKey !== shippingKey
        ) {
            setReviewQuote(null);
        }
    }, [format, quantity, reviewQuote, shippingKey, shippingLevel, size, step]);

    // Calculate fixed book price based on delivery type
    const bookPrice = deliveryType === 'digital' 
        ? getPrice(currency, 'digital')
        : getPrice(currency, 'print');

    // Fetch shipping cost from Lulu API (for print orders only)
    useEffect(() => {
        if (deliveryType === 'digital') {
            setShippingCost(0);
            return;
        }

        if (!book || !isShippingValid() || !shippingLevel) {
            setShippingCost(0);
            return;
        }

        const fetchShippingCost = async () => {
            try {
                const response = await fetch('/api/lulu/calculate-cost', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        format,
                        size,
                        pageCount: getPrintableInteriorPageCount(book, format, size),
                        quantity,
                        countryCode: shipping.country,
                        postalCode: shipping.postalCode,
                        stateCode: shipping.state,
                        shippingOption: shippingLevel,
                        shipping,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setShippingCost(data.shipping / 100); // Convert cents to dollars
                }
            } catch (err) {
                console.error('Shipping cost fetch error:', err);
            }
        };

        fetchShippingCost();
    }, [book, deliveryType, format, size, quantity, shipping, shippingLevel]);

    useEffect(() => {
        if (!book || !isShippingValid()) {
            setShippingOptions([]);
            setShippingLevel('');
            setShippingOptionsError(null);
            return;
        }

        const controller = new AbortController();
        const fetchOptions = async () => {
            setIsShippingOptionsLoading(true);
            setShippingOptionsError(null);
            try {
                const response = await fetch('/api/lulu/shipping-options', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        format,
                        size,
                        pageCount: getPrintableInteriorPageCount(book, format, size),
                        quantity,
                        shipping,
                        currency: 'USD',
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to load shipping options');
                }

                const data = await response.json();
                const options: ShippingOption[] = data.options || [];
                setShippingOptions(options);

                if (options.length > 0) {
                    const current = options.find((opt) => opt.level === shippingLevel);
                    setShippingLevel(current ? current.level : options[0].level);
                } else {
                    setShippingLevel('');
                    setShippingOptionsError('No shipping methods available for this address.');
                }
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                console.error('Shipping options error:', err);
                setShippingOptions([]);
                setShippingLevel('');
                setShippingOptionsError('Failed to load shipping methods.');
            } finally {
                setIsShippingOptionsLoading(false);
            }
        };

        const timer = setTimeout(fetchOptions, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [
        book,
        format,
        size,
        quantity,
        shipping.fullName,
        shipping.addressLine1,
        shipping.addressLine2,
        shipping.city,
        shipping.state,
        shipping.postalCode,
        shipping.country,
        shipping.phone,
    ]);

    const displayedShippingLevel = reviewQuote?.shippingLevel ?? shippingLevel;
    const displayedBookPrice = reviewQuote?.bookPrice ?? bookPrice;
    const displayedShippingCost = reviewQuote?.shipping ?? shippingCost;
    const grandTotal = displayedBookPrice + displayedShippingCost;
    
    const bookPriceLabel = t('summary.bookPrice');
    const bookPriceValue = formatPrice(displayedBookPrice, currency);
    const shippingValue = deliveryType === 'digital'
        ? t('summary.free')
        : (displayedShippingCost > 0
            ? formatPrice(displayedShippingCost, currency)
            : (isShippingValid()
                ? (isShippingOptionsLoading ? t('summary.calculating') : t('shipping.selectMethod'))
                : t('summary.calculated')));

    function isShippingValid() {
        // Strict Validation Rules for Lulu/FedEx
        const isAddressLinesValid =
            shipping.addressLine1.length <= 35 &&
            (shipping.addressLine2?.length || 0) <= 35;

        return shipping.fullName &&
            shipping.addressLine1 &&
            isAddressLinesValid &&
            shipping.city &&
            shipping.state &&
            shipping.postalCode &&
            shipping.phone &&
            shipping.country;
    }

    const handleContinueToReview = () => {
        if (deliveryType === 'print' && !shippingLevel) return;
        setReviewQuote({
            bookPrice,
            shipping: shippingCost,
            total: bookPrice + shippingCost,
            format,
            size,
            quantity,
            shippingLevel: deliveryType === 'digital' ? 'DIGITAL' : shippingLevel,
            shippingKey,
        });
        setStep('review');
    };

    const handleContinueToPayment = () => {
        if (!reviewQuote) {
            setReviewQuote({
                bookPrice,
                shipping: shippingCost,
                total: bookPrice + shippingCost,
                format,
                size,
                quantity,
                shippingLevel: deliveryType === 'digital' ? 'DIGITAL' : shippingLevel,
                shippingKey,
            });
        }
        setStep('payment');
    };



    const supabase = createClient();

    const uploadFile = async (blob: Blob, path: string) => {
        const { error } = await supabase.storage
            .from('book-pdfs')
            .upload(path, blob, { upsert: true });

        if (error) throw error;
        return path;
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

        if (!shippingLevel) {
            setError('Please select a shipping method');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            // Helper to wrap promise with timeout
            // Fix: Use 'extends unknown' or trailing comma for generics in TSX
            const withTimeout = async <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<T>((_, reject) =>
                        setTimeout(() => reject(new Error(msg)), ms)
                    )
                ]);
            };

            // 1. Generate PDFs (Client-side)
            const TIMEOUT_MS = 45000; // 45 seconds

            // Interior
            console.log('Generating interior PDF...');
            const interiorBlob = await withTimeout(
                generateInteriorPDF(book!, format, size),
                TIMEOUT_MS,
                'Interior PDF generation timed out. Please check your internet connection or images.'
            );

            // Cover
            console.log('Generating cover PDF...');
            const coverBlob = await withTimeout(
                generateCoverPDF(book!, format, size),
                TIMEOUT_MS,
                'Cover PDF generation timed out.'
            );

            // 2. Upload to Supabase Storage
            const timestamp = Date.now();
            const interiorPath = `${user.id}/${bookId}/${timestamp}_interior_${format}_${size}.pdf`;
            const coverPath = `${user.id}/${bookId}/${timestamp}_cover_${format}_${size}.pdf`;

            console.log('Uploading files...');
            await Promise.all([
                uploadFile(interiorBlob, interiorPath),
                uploadFile(coverBlob, coverPath)
            ]);

            // 3. Create Stripe Session with File Paths
            console.log('Creating checkout session...');
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    format,
                    size,
                    quantity,
                    shipping,
                    shippingLevel,
                    // Pass the paths to the API to save in the order
                    pdfUrl: interiorPath,
                    coverUrl: coverPath,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // 4. Redirect to Stripe
            const stripe = await getStripe();
            if (stripe && data.sessionId) {
                const { error: stripeError } = await stripe.redirectToCheckout({
                    sessionId: data.sessionId,
                });

                if (stripeError) {
                    throw new Error(stripeError.message);
                }
            } else if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            // Show detailed error to user so they can report it
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to prepare order: ${errorMessage}`);
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

    const availableSizes = getAvailableSizes(book.settings.printFormat);
    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme].colors
        : ['#6366f1', '#ec4899'];
    const interiorPageCount = getPrintableInteriorPageCount(book, format, size);
    const steps: OrderStep[] = ['options', 'shipping', 'review', 'payment'];
    const currentStepIndex = steps.indexOf(step);
    const countryName = COUNTRIES.find(country => country.code === shipping.country)?.name || shipping.country;
    const shippingLines = [
        shipping.fullName,
        shipping.addressLine1,
        shipping.addressLine2?.trim() ? shipping.addressLine2 : null,
        `${shipping.city}, ${shipping.state} ${shipping.postalCode}`,
        countryName,
        shipping.phone,
    ].filter(Boolean) as string[];
    const shippingLevelLabel = displayedShippingLevel ? formatShippingLevel(displayedShippingLevel) : '';

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push(`/book/${bookId}`)}
                >
                    {t('header.backButton')}
                </button>
                <h1 className={styles.headerTitle}>{t('header.title')}</h1>
                <div className={styles.placeholder}></div>
            </header>

            <div className={styles.orderLayout}>
                {/* Left - Options */}
                <div className={styles.optionsSection}>
                    {/* Step Indicator */}
                    <div className={styles.steps}>
                        {steps.map((s, i) => (
                            <div
                                key={s}
                                className={`${styles.stepIndicator} ${step === s ? styles.active : ''} ${i < currentStepIndex ? styles.completed : ''}`}
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
                            {/* Delivery Type Selection */}
                            <h2 className={styles.sectionTitle}>{t('delivery.title')}</h2>
                            <div className={styles.formatGrid}>
                                <button
                                    className={`${styles.formatCard} ${deliveryType === 'digital' ? styles.selected : ''}`}
                                    onClick={() => setDeliveryType('digital')}
                                >
                                    <span className={styles.formatIcon}>📱</span>
                                    <span className={styles.formatName}>{t('delivery.digital')}</span>
                                    <span className={styles.formatDesc}>{t('delivery.digitalDesc')}</span>
                                    {deliveryType === 'digital' && <span className={styles.checkmark}>✓</span>}
                                </button>
                                <button
                                    className={`${styles.formatCard} ${deliveryType === 'print' ? styles.selected : ''}`}
                                    onClick={() => setDeliveryType('print')}
                                >
                                    <span className={styles.formatIcon}>📦</span>
                                    <span className={styles.formatName}>{t('delivery.print')}</span>
                                    <span className={styles.formatDesc}>{t('delivery.printDesc')}</span>
                                    {deliveryType === 'print' && <span className={styles.checkmark}>✓</span>}
                                </button>
                            </div>

                            {/* Format Selection - Only show for print */}
                            {deliveryType === 'print' && (
                                <>
                                    <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>{t('format.title')}</h2>

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
                                            {t(`format.${f}`)}
                                        </span>
                                        <span className={styles.formatDesc}>
                                            {t(`format.${f}Desc`)}
                                        </span>
                                        {format === f && <span className={styles.checkmark}>✓</span>}
                                    </button>
                                ))}
                            </div>
                            <p className={styles.priceHint}>
                                Estimated price updates in the summary as you choose options.
                            </p>

                            <h2 className={styles.sectionTitle}>{t('size.title')}</h2>

                            <div className={styles.sizeGrid}>
                                {availableSizes.map(s => (
                                    <button
                                        key={s}
                                        className={`${styles.sizeCard} ${size === s ? styles.selected : ''}`}
                                        onClick={() => setSize(s)}
                                    >
                                        <span className={styles.sizePreview}>
                                            <span
                                                className={styles.sizeBox}
                                                style={{
                                                    width: '50px',
                                                    height: s === '8x8' ? '50px' : '62px'
                                                }}
                                            ></span>
                                        </span>
                                        <span className={styles.sizeName}>{SIZE_LABELS[s]}</span>
                                        {size === s && <span className={styles.checkmark}>✓</span>}
                                    </button>
                                ))}
                            </div>

                            <h2 className={styles.sectionTitle}>{t('quantity.title')}</h2>

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

                                    </>
                                )}

                            <button
                                className={styles.continueBtn}
                                onClick={() => {
                                    if (deliveryType === 'digital') {
                                        // Skip shipping for digital
                                        setStep('review');
                                    } else {
                                        setReviewQuote(null);
                                        setStep('shipping');
                                    }
                                }}
                            >
                                {deliveryType === 'digital' ? t('buttons.continue') : `${t('buttons.continue')} →`}
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
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>Address Line 1 *</label>
                                            <span style={{ fontSize: '11px', color: shipping.addressLine1.length > 35 ? 'red' : '#6b7280' }}>
                                                {shipping.addressLine1.length}/35
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.addressLine1}
                                            onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                                            placeholder="123 Main Street"
                                            maxLength={35}
                                            autoComplete="address-line1"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>Address Line 2</label>
                                            <span style={{ fontSize: '11px', color: (shipping.addressLine2?.length || 0) > 35 ? 'red' : '#6b7280' }}>
                                                {(shipping.addressLine2?.length || 0)}/35
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.addressLine2}
                                            onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                                            placeholder="Apt 4B (optional)"
                                            maxLength={35}
                                            autoComplete="address-line2"
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
                                            autoComplete="address-level2"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State / Province *</label>
                                        <input
                                            type="text"
                                            value={shipping.state}
                                            onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                            placeholder="NY"
                                            autoComplete="address-level1"
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
                                            autoComplete="postal-code"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Country *</label>
                                        <select
                                            value={shipping.country}
                                            onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                                            autoComplete="country"
                                        >
                                            {COUNTRIES.map(country => (
                                                <option key={country.code} value={country.code}>
                                                    {country.name}
                                                </option>
                                            ))}
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
                                            autoComplete="tel"
                                            required
                                        />
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Required for delivery updates</span>
                                    </div>
                                </div>

                                <div className={styles.shippingOptions}>
                                    <h3>Shipping Method</h3>
                                    {!isShippingValid() && (
                                        <p className={styles.helperText}>Enter a valid address to load shipping methods.</p>
                                    )}
                                    {isShippingValid() && isShippingOptionsLoading && (
                                        <p className={styles.helperText}>Loading shipping methods...</p>
                                    )}
                                    {isShippingValid() && shippingOptionsError && (
                                        <p className={styles.errorText}>{shippingOptionsError}</p>
                                    )}
                                    {isShippingValid() && !isShippingOptionsLoading && !shippingOptionsError && (
                                        <div className={styles.shippingOptionsList}>
                                            {shippingOptions.map((option) => (
                                                <label key={option.id} className={styles.shippingOption}>
                                                    <input
                                                        type="radio"
                                                        name="shippingLevel"
                                                        value={option.level}
                                                        checked={shippingLevel === option.level}
                                                        onChange={() => setShippingLevel(option.level)}
                                                    />
                                                    <div>
                                                        <div className={styles.shippingOptionTitle}>
                                                            <span>{option.level.replace('_', ' ')}</span>
                                                            {formatShippingCost(option) && (
                                                                <span className={styles.shippingOptionCost}>
                                                                    {formatShippingCost(option)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {(option.min_delivery_date || option.max_delivery_date) && (
                                                            <div className={styles.shippingOptionMeta}>
                                                                {option.min_delivery_date ? `Earliest ${option.min_delivery_date}` : ''}
                                                                {option.min_delivery_date && option.max_delivery_date ? ' · ' : ''}
                                                                {option.max_delivery_date ? `Latest ${option.max_delivery_date}` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                            {shippingOptions.length === 0 && (
                                                <p className={styles.helperText}>No shipping methods available for this address.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.buttonRow}>
                                    <button
                                        className={styles.backBtn}
                                        onClick={() => {
                                            setReviewQuote(null);
                                            setStep('options');
                                        }}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        className={styles.continueBtn}
                                        onClick={handleContinueToReview}
                                        disabled={!isShippingValid() || !shippingLevel || isShippingOptionsLoading}
                                    >
                                        Review Order →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Review Step */}
                    {step === 'review' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.stepContent}
                        >
                            <h2 className={styles.sectionTitle}>Review Your Order</h2>

                            <div className={styles.reviewGrid}>
                                <div className={styles.reviewCard}>
                                    <h3 className={styles.reviewTitle}>Book Details</h3>
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
                                            <span>Pages</span>
                                            <span>{interiorPageCount}</span>
                                        </div>
                                        <div className={styles.optionRow}>
                                            <span>Quantity</span>
                                            <span>×{quantity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.reviewCard}>
                                    <h3 className={styles.reviewTitle}>Shipping</h3>
                                    <div className={styles.reviewText}>
                                        {shippingLines.map((line, index) => (
                                            <div key={`${index}-${line}`}>{line}</div>
                                        ))}
                                    </div>
                                    <div className={styles.selectedOptions}>
                                        <div className={styles.optionRow}>
                                            <span>Method</span>
                                            <span>{shippingLevelLabel || '—'}</span>
                                        </div>
                                        <div className={styles.optionRow}>
                                            <span>Shipping</span>
                                            <span>{shippingValue}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.reviewCard}>
                                    <h3 className={styles.reviewTitle}>Pricing</h3>
                                    <div className={styles.pricing}>
                                        <div className={styles.priceRow}>
                                            <span>{bookPriceLabel}</span>
                                            <span>{bookPriceValue}</span>
                                        </div>
                                        <div className={styles.priceRow}>
                                            <span>Shipping</span>
                                            <span>{shippingValue}</span>
                                        </div>
                                        {displayedShippingCost > 0 && (
                                            <div className={`${styles.priceRow} ${styles.total}`}>
                                                <span>Total</span>
                                                <span>{formatPrice(grandTotal, currency)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className={styles.pricingNote}>
                                        {deliveryType === 'digital' 
                                            ? 'Digital books are delivered instantly via email after purchase.'
                                            : 'Shipping cost calculated based on your address and selected shipping method.'}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <button
                                    className={styles.backBtn}
                                    onClick={() => {
                                        setReviewQuote(null);
                                        setStep('shipping');
                                    }}
                                >
                                    ← Back
                                </button>
                                <button
                                    className={styles.continueBtn}
                                    onClick={handleContinueToPayment}
                                    disabled={deliveryType === 'print' && !displayedShippingLevel}
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
                                h3&gt;Secure Checkout&lt;/h3
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
                                    onClick={() => setStep('review')}
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
                                            Preparing Book...
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
                        <h2 className={styles.summaryTitle}>{t('summary.title')}</h2>

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
                                <p>{interiorPageCount} pages</p>
                            </div>
                        </div>

                        {/* Selected Options */}
                        <div className={styles.selectedOptions}>
                            <div className={styles.optionRow}>
                                <span>{t('summary.format')}</span>
                                <span>{t(`format.${format}`)}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>{t('summary.size')}</span>
                                <span>{size}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>{t('summary.pages')}</span>
                                <span>{interiorPageCount}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>{t('summary.quantity')}</span>
                                <span>×{quantity}</span>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className={styles.pricing}>
                            <div className={styles.priceRow}>
                                <span>
                                    {bookPriceLabel}
                                </span>
                                <span>{bookPriceValue}</span>
                            </div>
                            <div className={styles.priceRow}>
                                <span>{t('summary.shipping')}</span>
                                <span>{shippingValue}</span>
                            </div>
                            <div className={`${styles.priceRow} ${styles.total}`}>
                                <span>{t('summary.total')}</span>
                                <span>{formatPrice(grandTotal, currency)}</span>
                            </div>
                            <p className={styles.pricingNote}>
                                {deliveryType === 'digital'
                                    ? t('summary.digitalNote')
                                    : t('summary.printNote')}
                            </p>
                        </div>

                        {/* Delivery Estimate */}
                        <div className={styles.deliveryBox}>
                            <span className={styles.deliveryIcon}>📦</span>
                            <div>
                                <strong>{t('summary.estimatedDelivery')}</strong>
                                <p>5-10 {t('summary.businessDays', { min: 5, max: 10 })}</p>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className={styles.trustBadges}>
                            <div className={styles.badge}>
                                <span>✨</span>
                                <span>{t('summary.premiumQuality')}</span>
                            </div>
                            <div className={styles.badge}>
                                <span>🌱</span>
                                <span>{t('summary.ecoFriendly')}</span>
                            </div>
                            <div className={styles.badge}>
                                <span>💯</span>
                                <span>{t('summary.satisfactionGuaranteed')}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
        </>
    );
}
