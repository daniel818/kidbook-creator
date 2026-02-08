'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Elements } from '@stripe/react-stripe-js';
import { Book, BookTypeInfo, BookThemeInfo } from '@/lib/types';
import { getBookById } from '@/lib/storage';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStripe } from '@/lib/stripe/client';
import { COUNTRIES } from '@/lib/countries';
import { generateInteriorPDF } from '@/lib/lulu/pdf-generator';
import { generateCoverPDF } from '@/lib/lulu/cover-generator';
import { getPrintableInteriorPageCount } from '@/lib/lulu/page-count';
import { createClient } from '@/lib/supabase/client';
import { track, EVENTS } from '@/lib/analytics';
import PaymentForm from '@/components/PaymentForm/PaymentForm';
import styles from './page.module.css';

type BookFormat = 'softcover' | 'hardcover';
type BookSize = '7.5x7.5' | '8x8' | '8x10';
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

const ALL_SIZES: BookSize[] = ['7.5x7.5', '8x8', '8x10'];
const SIZES_BY_RATIO: Record<'square' | 'portrait', BookSize[]> = {
    square: ['7.5x7.5', '8x8'],
    portrait: ['8x10']
};
// Estimated starting prices shown on the options step before the server quote arrives.
// Actual price is computed server-side via calculateRetailPricing on shipping/review steps.
const FORMAT_STARTING_PRICES: Record<BookFormat, number> = {
    softcover: 24.99,
    hardcover: 39.99
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

    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [format, setFormat] = useState<BookFormat>('softcover');
    const [size, setSize] = useState<BookSize>('8x8');
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<OrderStep>('options');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUnlockCheckout, setIsUnlockCheckout] = useState(false);

    // Embedded Stripe PaymentElement state
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [isCreatingIntent, setIsCreatingIntent] = useState(false);

    // Digital unlock embedded payment state
    const [unlockClientSecret, setUnlockClientSecret] = useState<string | null>(null);

    // Dynamic pricing state
    const [priceData, setPriceData] = useState<{
        subtotal: number;
        shipping: number;
        total: number;
        isEstimate: boolean;
    } | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);

    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [shippingLevel, setShippingLevel] = useState<string>('');
    const [isShippingOptionsLoading, setIsShippingOptionsLoading] = useState(false);
    const [shippingOptionsError, setShippingOptionsError] = useState<string | null>(null);
    const [reviewQuote, setReviewQuote] = useState<{
        pricing: {
            subtotal: number;
            shipping: number;
            total: number;
            isEstimate: boolean;
        };
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
    // Track if checkout has been tracked for this page load
    const hasTrackedCheckout = useRef(false);

    // Load book on mount
    useEffect(() => {
        const loadBook = async () => {
            // 1. Try Local Storage
            const localBook = getBookById(bookId);
            if (localBook) {
                setBook(localBook);
                // Track checkout started
                if (!hasTrackedCheckout.current) {
                    hasTrackedCheckout.current = true;
                    track(EVENTS.CHECKOUT_STARTED, {
                        book_id: localBook.id,
                        checkout_type: localBook.digitalUnlockPaid ? 'print' : 'digital',
                        price_usd: localBook.digitalUnlockPaid ? FORMAT_STARTING_PRICES.softcover : 4.99,
                    });
                }
                setIsLoading(false);
                return;
            }

            // 2. Try API Fetch (Fallback)
            try {
                const res = await fetch(`/api/books/${bookId}`);
                if (res.ok) {
                    const data = await res.json();
                    const bookData = data.book || data;
                    setBook(bookData);
                    // Track checkout started
                    if (!hasTrackedCheckout.current) {
                        hasTrackedCheckout.current = true;
                        track(EVENTS.CHECKOUT_STARTED, {
                            book_id: bookData.id,
                            checkout_type: bookData.digitalUnlockPaid ? 'print' : 'digital',
                            price_usd: bookData.digitalUnlockPaid ? FORMAT_STARTING_PRICES.softcover : 4.99,
                        });
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

    const handleUnlockCheckout = async () => {
        if (isUnlockCheckout) return;
        setIsUnlockCheckout(true);
        try {
            const response = await fetch('/api/checkout/digital', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to start unlock checkout');
            }
            if (data.clientSecret) {
                setUnlockClientSecret(data.clientSecret);
            }
        } catch (err) {
            console.error('Unlock checkout error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start unlock checkout');
        } finally {
            setIsUnlockCheckout(false);
        }
    };

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

    // Fetch price from API when options change
    const fetchPrice = useCallback(async () => {
        if (!book) return;

        const interiorPageCount = getPrintableInteriorPageCount(book, format, size);
        setIsPriceLoading(true);
        setPriceError(null);
        try {
            const pricingShipping = isShippingValid()
                ? shipping
                : {
                    fullName: 'Pricing Estimate',
                    addressLine1: '123 Main St',
                    addressLine2: '',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: shipping.country || 'US',
                    phone: '0000000000',
                };
            const pricingShippingOption = shippingLevel || 'MAIL';

            const response = await fetch('/api/lulu/calculate-cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    size,
                    pageCount: interiorPageCount,
                    quantity,
                    countryCode: pricingShipping.country,
                    postalCode: pricingShipping.postalCode,
                    stateCode: pricingShipping.state,
                    shippingOption: pricingShippingOption,
                    shipping: pricingShipping,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setPriceData({
                    subtotal: data.subtotal / 100, // Convert cents to dollars
                    shipping: data.shipping / 100,
                    total: data.total / 100,
                    isEstimate: data.isEstimate,
                });
                setPriceError(null);
            } else {
                let message = 'Pricing unavailable. Please try again.';
                try {
                    const data = await response.json();
                    if (data?.error) message = data.error;
                } catch {
                    // Ignore parsing errors
                }
                setPriceData(null);
                setPriceError(message);
            }
        } catch (err) {
            console.error('Price fetch error:', err);
            setPriceData(null);
            setPriceError('Pricing unavailable. Please try again.');
        } finally {
            setIsPriceLoading(false);
        }
    }, [book, format, size, quantity, shipping.postalCode, shipping.country, shippingLevel]);

    // Debounced price fetch
    useEffect(() => {
        const timer = setTimeout(fetchPrice, 300);
        return () => clearTimeout(timer);
    }, [fetchPrice]);

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

    const displayedPricing = reviewQuote?.pricing ?? priceData;
    const displayedShippingLevel = reviewQuote?.shippingLevel ?? shippingLevel;
    const totalPrice = displayedPricing?.subtotal ?? 0;
    const hasShippingQuote = Boolean(displayedShippingLevel) && Boolean(displayedPricing);
    const shippingCost = hasShippingQuote ? displayedPricing!.shipping : 0;

    const grandTotal = hasShippingQuote ? displayedPricing!.total : totalPrice;
    const bookPriceLabel = 'Book price (printing + production)';
    const bookPriceValue = priceError
        ? 'Unavailable'
        : displayedPricing
            ? `$${totalPrice.toFixed(2)}`
            : (isPriceLoading ? 'Calculating...' : '—');
    const shippingValue = hasShippingQuote
        ? `$${shippingCost.toFixed(2)}`
        : (isShippingValid()
            ? (isShippingOptionsLoading ? 'Calculating...' : 'Select a shipping method')
            : 'Calculated after address');

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
        if (!priceData || !shippingLevel) return;
        setReviewQuote({
            pricing: priceData,
            format,
            size,
            quantity,
            shippingLevel,
            shippingKey,
        });
        setStep('review');
    };

    const handleContinueToPayment = async () => {
        if (!reviewQuote && priceData && shippingLevel) {
            setReviewQuote({
                pricing: priceData,
                format,
                size,
                quantity,
                shippingLevel,
                shippingKey,
            });
        }
        setStep('payment');

        // Create PaymentIntent + order immediately so PaymentElement can render
        setIsCreatingIntent(true);
        setError(null);
        setClientSecret(null);
        setPaymentOrderId(null);

        try {
            const response = await fetch('/api/checkout/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    format,
                    size,
                    quantity,
                    shipping,
                    shippingLevel,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize payment');
            }

            setClientSecret(data.clientSecret);
            setPaymentOrderId(data.orderId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        } finally {
            setIsCreatingIntent(false);
        }
    };



    const supabase = createClient();

    const uploadFile = async (blob: Blob, path: string) => {
        const { error } = await supabase.storage
            .from('book-pdfs')
            .upload(path, blob, { upsert: true });

        if (error) throw error;
        return path;
    };

    /**
     * Called by PaymentForm before stripe.confirmPayment().
     * Generates PDFs, uploads them, and attaches them to the order.
     * Returns true when ready for payment confirmation.
     */
    const handlePrepareAndPay = async (): Promise<boolean> => {
        if (!user || !paymentOrderId) {
            setError('Please sign in to complete your order');
            return false;
        }

        if (!agreedToTerms) {
            setError('Please agree to the Terms of Service');
            return false;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const withTimeout = async <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<T>((_, reject) =>
                        setTimeout(() => reject(new Error(msg)), ms)
                    )
                ]);
            };

            const TIMEOUT_MS = 45000;

            // 1. Generate PDFs (Client-side)
            console.log('Generating interior PDF...');
            const interiorBlob = await withTimeout(
                generateInteriorPDF(book!, format, size),
                TIMEOUT_MS,
                'Interior PDF generation timed out. Please check your internet connection or images.'
            );

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

            // 3. Attach PDF paths to the order
            console.log('Attaching PDFs to order...');
            const attachResponse = await fetch('/api/checkout/attach-pdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: paymentOrderId,
                    pdfUrl: interiorPath,
                    coverUrl: coverPath,
                }),
            });

            if (!attachResponse.ok) {
                const attachData = await attachResponse.json();
                throw new Error(attachData.error || 'Failed to prepare order files');
            }

            return true; // Ready for payment confirmation
        } catch (err) {
            console.error('Prepare order error:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to prepare order: ${errorMessage}`);
            setIsProcessing(false);
            return false;
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
    const coverPage = book.pages.find((page) => page.type === 'cover') || book.pages[0];
    const coverImageUrl = (
        coverPage?.imageElements?.[0]?.src ||
        coverPage?.backgroundImage ||
        (coverPage as { background_image?: string } | undefined)?.background_image ||
        book.thumbnailUrl ||
        null
    );
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
    const isPreview = book.status === 'preview' || book.isPreview;
    const optionBookPrice = FORMAT_STARTING_PRICES[format];
    const optionTotal = optionBookPrice;
    const isOptionsStep = step === 'options';
    const isShippingStep = step === 'shipping';
    const isReviewStep = step === 'review';
    const isPaymentStep = step === 'payment';
    const shippingFooterTotal = hasShippingQuote ? grandTotal : totalPrice;

    return (
        <main className={`${styles.main} ${isOptionsStep ? styles.stitchOrderMain : ''}`}>
            {/* Header */}
            {(isOptionsStep || isShippingStep || isReviewStep || isPaymentStep) ? (
                <header className={styles.stitchOrderHeader}>
                    <div className={styles.stitchOrderTopRow}>
                        <button
                            className={styles.stitchBackButton}
                            onClick={() =>
                                isPaymentStep
                                    ? setStep('review')
                                    : isReviewStep
                                        ? setStep('shipping')
                                        : isShippingStep
                                            ? setStep('options')
                                            : router.push(`/book/${bookId}`)
                            }
                            aria-label={
                                isPaymentStep
                                    ? 'Back to review'
                                    : isReviewStep
                                        ? 'Back to shipping'
                                        : isShippingStep
                                            ? 'Back to options'
                                            : 'Back to book'
                            }
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className={styles.stitchOrderTitle}>Order Your Book</h1>
                        <div className={styles.stitchOrderTopSpacer}></div>
                    </div>
                    {isPaymentStep ? (
                        <div className={`${styles.stitchPreviewPill} ${styles.stitchSecurePill}`}>
                            <span className="material-symbols-outlined">lock</span>
                            <span>SSL</span>
                        </div>
                    ) : isPreview && !book.digitalUnlockPaid ? (
                        <div className={styles.stitchPreviewPill}>
                            <span className="material-symbols-outlined">visibility</span>
                            <span>Preview Mode</span>
                        </div>
                    ) : null}
                    <div className={styles.stitchOrderStepper}>
                        {steps.map((s, i) => (
                            <div key={s} className={styles.stitchOrderStepItem}>
                                <div className={`${styles.stitchOrderStepBar} ${i <= currentStepIndex ? styles.stitchOrderStepBarActive : ''}`}></div>
                                {i === currentStepIndex && <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>}
                            </div>
                        ))}
                    </div>
                </header>
            ) : (
                <header className={styles.header}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.push(`/book/${bookId}`)}
                        aria-label="Back to book"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className={styles.headerTitle}>Order Your Book</h1>
                    <div className={styles.placeholder}></div>
                </header>
            )}

            {isPreview && !book.digitalUnlockPaid && !isOptionsStep && !isShippingStep && (
                <div className={styles.previewNotice}>
                    <div>
                        <strong>Preview Mode</strong>
                        <p>Your order includes digital unlock. All pages will be generated after payment.</p>
                    </div>
                    <div className={styles.previewNoticeActions}>
                        <button
                            className={styles.previewNoticeBtn}
                            onClick={handleUnlockCheckout}
                            disabled={isUnlockCheckout}
                        >
                            {isUnlockCheckout ? 'Opening checkout…' : 'Unlock $15 (Digital Only)'}
                        </button>
                        <button
                            className={styles.previewNoticeSecondary}
                            onClick={() => router.push(`/book/${bookId}`)}
                        >
                            Back to Preview
                        </button>
                    </div>
                </div>
            )}

            {/* Digital Unlock Payment Modal */}
            {unlockClientSecret && (
                <div className={styles.unlockOverlay}>
                    <div className={styles.unlockModal}>
                        <h3 className={styles.unlockModalTitle}>Unlock Full Book — $15</h3>
                        <p className={styles.unlockModalDesc}>
                            Get the complete story, all illustrations, and high-res PDF download.
                        </p>
                        <Elements
                            stripe={getStripe()}
                            options={{
                                clientSecret: unlockClientSecret,
                                appearance: {
                                    theme: 'stripe',
                                    variables: {
                                        colorPrimary: '#6366f1',
                                        colorBackground: '#ffffff',
                                        colorText: '#111827',
                                        colorDanger: '#ef4444',
                                        fontFamily: 'Inter, system-ui, sans-serif',
                                        borderRadius: '12px',
                                    },
                                },
                            }}
                        >
                            <PaymentForm
                                amount={15}
                                onConfirmClick={async () => true}
                                isPreparingOrder={false}
                                onPaymentSuccess={() => {
                                    setUnlockClientSecret(null);
                                    router.push(`/unlock/success?bookId=${bookId}`);
                                }}
                                onPaymentError={(errMsg) => {
                                    setError(errMsg);
                                }}
                                returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/unlock/success?bookId=${bookId}`}
                            />
                        </Elements>
                        <button
                            className={styles.unlockModalClose}
                            onClick={() => {
                                setUnlockClientSecret(null);
                                setIsUnlockCheckout(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className={`${styles.orderLayout} ${isOptionsStep ? styles.stitchOrderLayout : ''}`}>
                {/* Left - Options */}
                <div className={styles.optionsSection}>
                    {/* Step Indicator */}
                    <div className={`${styles.steps} ${(isOptionsStep || isShippingStep || isReviewStep || isPaymentStep) ? styles.stitchDesktopSteps : ''}`}>
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
                            className={styles.stitchOptionsContent}
                        >
                            <h2 className={styles.stitchSectionTitle}>Choose Format</h2>

                            <div className={styles.stitchFormatGrid}>
                                {(['softcover', 'hardcover'] as BookFormat[]).map(f => (
                                    <button
                                        key={f}
                                        className={`${styles.stitchFormatCard} ${format === f ? styles.stitchFormatCardSelected : ''}`}
                                        onClick={() => setFormat(f)}
                                    >
                                        {f === 'hardcover' && <span className={styles.stitchPopularTag}>Popular</span>}
                                        <div
                                            className={styles.stitchFormatImage}
                                            style={{
                                                backgroundImage: f === 'softcover'
                                                    ? 'url("/images/softcover-book.png")'
                                                    : 'url("/images/hardcover-book.png")'
                                            }}
                                        ></div>
                                        <div className={styles.stitchFormatMeta}>
                                            <div>
                                                <p className={`${styles.stitchFormatName} ${format === f ? styles.stitchFormatNameActive : ''}`}>
                                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                                </p>
                                                <p className={styles.stitchFormatPrice}>${FORMAT_STARTING_PRICES[f].toFixed(2)}</p>
                                            </div>
                                            <span className={`material-symbols-outlined ${styles.stitchFormatMark} ${format === f ? styles.stitchFormatMarkActive : ''}`}>
                                                {format === f ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <h2 className={styles.stitchSectionTitle}>Select Size</h2>

                            <div className={styles.stitchSizeList}>
                                {availableSizes.map(s => (
                                    <button
                                        key={s}
                                        className={`${styles.stitchSizeRow} ${size === s ? styles.stitchSizeRowSelected : ''}`}
                                        onClick={() => setSize(s)}
                                    >
                                        <span className={`${styles.stitchSizeIconWrap} ${size === s ? styles.stitchSizeIconWrapActive : ''}`}>
                                            <span className="material-symbols-outlined">
                                                {s === '7.5x7.5' ? 'aspect_ratio' : s === '8x8' ? 'crop_square' : 'crop_portrait'}
                                            </span>
                                        </span>
                                        <span className={styles.stitchSizeText}>
                                            <span className={`${styles.stitchSizeTitle} ${size === s ? styles.stitchSizeTitleActive : ''}`}>
                                                {s === '7.5x7.5' ? '7.5 × 7.5 inch' : s === '8x8' ? '8.5 × 8.5 inch' : '8.5 × 11 inch'}
                                            </span>
                                            <span className={styles.stitchSizeSubtitle}>
                                                {s === '7.5x7.5' ? 'Compact square' : s === '8x8' ? 'Standard Square' : 'Large Portrait'}
                                            </span>
                                        </span>
                                        <span className={`material-symbols-outlined ${styles.stitchSizeMark} ${size === s ? styles.stitchSizeMarkActive : ''}`}>
                                            {size === s ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.stitchQuantityCard}>
                                <div>
                                    <h2 className={styles.stitchQuantityTitle}>Quantity</h2>
                                    <p className={styles.stitchQuantitySubtitle}>Copies to print</p>
                                </div>
                                <div className={styles.stitchQtyControl}>
                                    <button
                                        className={styles.stitchQtyBtn}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <span className="material-symbols-outlined">remove</span>
                                    </button>
                                    <span className={styles.stitchQtyValue}>{quantity}</span>
                                    <button
                                        className={`${styles.stitchQtyBtn} ${styles.stitchQtyBtnPrimary}`}
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.stitchTrustRow}>
                                <div>
                                    <span className="material-symbols-outlined">eco</span>
                                </div>
                                <div>
                                    <span className="material-symbols-outlined">verified</span>
                                </div>
                            </div>

                            <button
                                className={styles.stitchDesktopContinue}
                                onClick={() => {
                                    setReviewQuote(null);
                                    setStep('shipping');
                                }}
                            >
                                <span>Continue to Shipping</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </motion.div>
                    )}

                    {step === 'options' && (
                        <footer className={`${styles.stitchFooter} ${styles.stitchFooterMobile}`}>
                            <div className={styles.stitchFooterHandle}></div>
                            <div className={styles.stitchFooterSummary}>
                                <div
                                    className={styles.stitchFooterCover}
                                    style={{
                                        background: `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                    }}
                                >
                                    <span>{BookTypeInfo[book.settings.bookType].icon}</span>
                                </div>
                                <div className={styles.stitchFooterMeta}>
                                    <div className={styles.stitchFooterTitleRow}>
                                        <h4>{book.settings.title}</h4>
                                        <span>${optionTotal.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.stitchFooterLines}>
                                        <div>
                                            <span>{format.charAt(0).toUpperCase() + format.slice(1)} Book (x{quantity})</span>
                                            <span>${optionBookPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className={styles.stitchContinueBtn}
                                onClick={() => {
                                    setReviewQuote(null);
                                    setStep('shipping');
                                }}
                            >
                                <span>Continue to Shipping</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </footer>
                    )}

                    {/* Shipping Step */}
                    {step === 'shipping' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${styles.stepContent} ${styles.stitchShippingContent}`}
                        >
                            <h2 className={`${styles.sectionTitle} ${styles.stitchShippingTitle}`}>Shipping Details</h2>
                            <p className={styles.stitchShippingSubtitle}>Where should we send your masterpiece?</p>

                            <div className={`${styles.shippingForm} ${styles.stitchShippingForm}`}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>Full Name *</label>
                                            <span style={{ fontSize: '11px', color: shipping.fullName.length > 50 ? 'red' : '#6b7280' }}>
                                                {shipping.fullName.length}/50
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.fullName}
                                            onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                                            placeholder="John Doe"
                                            maxLength={50}
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>City *</label>
                                            <span style={{ fontSize: '11px', color: shipping.city.length > 35 ? 'red' : '#6b7280' }}>
                                                {shipping.city.length}/35
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.city}
                                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                            placeholder="New York"
                                            maxLength={35}
                                            autoComplete="address-level2"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>State / Province *</label>
                                            <span style={{ fontSize: '11px', color: shipping.state.length > 30 ? 'red' : '#6b7280' }}>
                                                {shipping.state.length}/30
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.state}
                                            onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                            placeholder="NY"
                                            maxLength={30}
                                            autoComplete="address-level1"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>Postal Code *</label>
                                            <span style={{ fontSize: '11px', color: shipping.postalCode.length > 10 ? 'red' : '#6b7280' }}>
                                                {shipping.postalCode.length}/10
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={shipping.postalCode}
                                            onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                                            placeholder="10001"
                                            maxLength={10}
                                            autoComplete="postal-code"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <label>Phone Number *</label>
                                            <span style={{ fontSize: '11px', color: shipping.phone.length > 20 ? 'red' : '#6b7280' }}>
                                                {shipping.phone.length}/20
                                            </span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={shipping.phone}
                                            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                            placeholder="+1 (555) 123-4567"
                                            maxLength={20}
                                            autoComplete="tel"
                                            required
                                        />
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Required for delivery updates</span>
                                    </div>
                                </div>

                                <div className={`${styles.shippingOptions} ${styles.stitchShippingMethods}`}>
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

                                <div className={`${styles.buttonRow} ${styles.stitchShippingButtonRow}`}>
                                    <button
                                        className={`${styles.continueBtn} ${styles.stitchContinueBtn} ${styles.stitchShippingInlineContinue}`}
                                        onClick={handleContinueToReview}
                                        disabled={isPreview || !isShippingValid() || !shippingLevel || isShippingOptionsLoading || isPriceLoading || !priceData}
                                    >
                                        Review Order →
                                    </button>
                                </div>
                            </div>

                            <div className={styles.stitchShippingFooterMobile}>
                                <div className={styles.stitchShippingTotals}>
                                    <div><span>Book ({quantity}x)</span><span>{bookPriceValue === 'Unavailable' || bookPriceValue === '—' ? '$0.00' : bookPriceValue}</span></div>
                                    <div><span>Shipping</span><span>{hasShippingQuote ? `$${shippingCost.toFixed(2)}` : '$0.00'}</span></div>
                                    <div className={styles.stitchShippingTotalLine}></div>
                                    <div className={styles.stitchShippingTotalRow}><span>Total</span><span>${shippingFooterTotal.toFixed(2)}</span></div>
                                </div>
                                <button
                                    className={`${styles.stitchContinueBtn} ${styles.stitchShippingContinueBtn}`}
                                    onClick={handleContinueToReview}
                                    disabled={isPreview || !isShippingValid() || !shippingLevel || isShippingOptionsLoading || isPriceLoading || !priceData}
                                >
                                    <span>Continue to Review</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Review Step */}
                    {step === 'review' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${styles.stepContent} ${styles.stitchReviewContent}`}
                        >
                            <div className={styles.stitchReviewCards}>
                                <div className={styles.stitchReviewCard}>
                                    <div
                                        className={styles.stitchReviewBookThumb}
                                        style={coverImageUrl
                                            ? { backgroundImage: `url(${coverImageUrl})` }
                                            : { background: `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)` }}
                                    >
                                        {!coverImageUrl && <span>{BookTypeInfo[book.settings.bookType].icon}</span>}
                                    </div>
                                    <div className={styles.stitchReviewBookMeta}>
                                        <h3>{book.settings.title}</h3>
                                        <p>{format.charAt(0).toUpperCase() + format.slice(1)}, {size}</p>
                                        <p>Age: {book.settings.childAge || '—'} years</p>
                                        <p>Qty: {quantity}</p>
                                    </div>
                                    <button className={styles.stitchReviewEditBtn} onClick={() => setStep('options')}>Edit</button>
                                </div>

                                <div className={styles.stitchReviewCardCompact}>
                                    <div className={styles.stitchReviewIconWrap}><span className="material-symbols-outlined">location_on</span></div>
                                    <div className={styles.stitchReviewCompactMeta}>
                                        <h4>Shipping Address</h4>
                                        <p>{shipping.fullName || '—'}</p>
                                        <p>{shipping.addressLine1 || '—'}{shipping.city ? `, ${shipping.city}` : ''}</p>
                                    </div>
                                    <button className={styles.stitchReviewEditBtn} onClick={() => setStep('shipping')}>Edit</button>
                                </div>

                                <div className={styles.stitchReviewCardCompact}>
                                    <div className={styles.stitchReviewIconWrap}><span className="material-symbols-outlined">package_2</span></div>
                                    <div className={styles.stitchReviewCompactMeta}>
                                        <h4>{shippingLevelLabel || 'Shipping Method'}</h4>
                                        <p>{shippingOptions.find(o => o.level === displayedShippingLevel)?.min_delivery_date && shippingOptions.find(o => o.level === displayedShippingLevel)?.max_delivery_date
                                            ? `Est. ${shippingOptions.find(o => o.level === displayedShippingLevel)?.min_delivery_date} - ${shippingOptions.find(o => o.level === displayedShippingLevel)?.max_delivery_date}`
                                            : '5-10 business days'}</p>
                                    </div>
                                    <button className={styles.stitchReviewEditBtn} onClick={() => setStep('shipping')}>Edit</button>
                                </div>

                                <div className={styles.stitchReviewPriceCard}>
                                    <div><span>Book Price (x{quantity})</span><span>{bookPriceValue === 'Unavailable' || bookPriceValue === '—' ? '$0.00' : bookPriceValue}</span></div>
                                    <div><span>Shipping</span><span>{hasShippingQuote ? `$${shippingCost.toFixed(2)}` : '$0.00'}</span></div>
                                    <div>
                                        <span className={styles.stitchReviewDigitalRow}>Digital Copy <span className="material-symbols-outlined">verified</span></span>
                                        <span className={styles.stitchReviewFreeLabel}>Free</span>
                                    </div>
                                    <div className={styles.stitchReviewPriceDivider}></div>
                                    <div className={styles.stitchReviewTotalRow}><span>Total</span><span>${shippingFooterTotal.toFixed(2)}</span></div>
                                </div>
                            </div>

                            <div className={styles.stitchReviewTerms}>
                                <label className={styles.stitchReviewCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    />
                                    <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                                </label>
                            </div>

                            {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                            <button
                                className={`${styles.stitchContinueBtn} ${styles.stitchReviewProceedBtn}`}
                                onClick={handleContinueToPayment}
                                disabled={isPreview || !displayedPricing || !displayedShippingLevel || !agreedToTerms}
                            >
                                <span>Proceed to Payment</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Payment Step — Embedded Stripe PaymentElement */}
                    {step === 'payment' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${styles.stepContent} ${styles.stitchPaymentContent}`}
                        >
                            {!user && (
                                <div className={styles.loginNotice}>
                                    <span>🔐</span>
                                    <p>Please sign in to complete your order. Your book will be saved to your account.</p>
                                </div>
                            )}

                            <div className={styles.stitchPaymentAmountCard}>
                                <div className={styles.stitchPaymentAmountHeader}>
                                    <div>
                                        <p className={styles.stitchPaymentAmountLabel}>Total Amount</p>
                                        <p className={styles.stitchPaymentAmountValue}>${shippingFooterTotal.toFixed(2)}</p>
                                    </div>
                                    <button type="button" className={styles.stitchPaymentDetailsBtn}>
                                        <span>View details</span>
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                                <div className={styles.stitchPaymentAmountDivider}></div>
                                <div className={styles.stitchPaymentTaxRow}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span>Includes shipping &amp; estimated taxes</span>
                                </div>
                            </div>

                            {isCreatingIntent && (
                                <div className={styles.paymentLoading}>
                                    <span className={styles.btnSpinner}></span>
                                    <p>Setting up secure payment...</p>
                                </div>
                            )}

                            {clientSecret && (
                                <Elements
                                    stripe={getStripe()}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: {
                                                colorPrimary: '#6366f1',
                                                colorBackground: '#ffffff',
                                                colorText: '#111827',
                                                colorDanger: '#ef4444',
                                                fontFamily: 'Inter, system-ui, sans-serif',
                                                borderRadius: '12px',
                                                spacingUnit: '4px',
                                            },
                                            rules: {
                                                '.Input': {
                                                    border: '2px solid #e5e7eb',
                                                    padding: '12px',
                                                    transition: 'all 0.15s ease',
                                                },
                                                '.Input:focus': {
                                                    borderColor: '#6366f1',
                                                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                                                },
                                                '.Tab': {
                                                    borderRadius: '12px',
                                                },
                                                '.Tab--selected': {
                                                    borderColor: '#6366f1',
                                                    boxShadow: '0 0 0 1px #6366f1',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <div className={styles.stitchPaymentTermsRow}>
                                        <label className={styles.stitchReviewCheckbox}>
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

                                    <PaymentForm
                                        amount={grandTotal}
                                        onConfirmClick={handlePrepareAndPay}
                                        isPreparingOrder={isProcessing}
                                        onPaymentSuccess={(piId) => {
                                            router.push(`/order/success?payment_intent=${piId}&order_id=${paymentOrderId}`);
                                        }}
                                        onPaymentError={(errMsg) => {
                                            setError(errMsg);
                                            setIsProcessing(false);
                                        }}
                                        returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/order/success?order_id=${paymentOrderId}`}
                                        disabled={!agreedToTerms || !user || isPreview}
                                    />
                                </Elements>
                            )}

                            <div className={styles.stitchPaymentSecureRow}>
                                <span className="material-symbols-outlined">lock</span>
                                <span>Payment information is secure</span>
                            </div>

                            <div className={styles.stitchPaymentPoweredBy}>Powered by <em>stripe</em></div>
                        </motion.div>
                    )}
                </div>

                {/* Right - Order Summary */}
                <aside className={`${styles.summarySection} ${isOptionsStep ? styles.stitchSummaryOnOptions : ''} ${(isShippingStep || isPaymentStep) ? styles.stitchHideSummaryMobile : ''} ${isReviewStep ? styles.stitchHideSummaryReview : ''}`}>
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
                                <p>{interiorPageCount} pages</p>
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
                                <span>Pages</span>
                                <span>{interiorPageCount}</span>
                            </div>
                            <div className={styles.optionRow}>
                                <span>Quantity</span>
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
                            {hasShippingQuote ? (
                                <>
                                    <div className={styles.priceRow}>
                                        <span>Shipping</span>
                                        <span>{shippingValue}</span>
                                    </div>
                                    <div className={`${styles.priceRow} ${styles.total}`}>
                                        <span>Total</span>
                                        <span>${grandTotal.toFixed(2)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.priceRow}>
                                        <span>Shipping</span>
                                        <span>{shippingValue}</span>
                                    </div>
                                </>
                            )}
                            <p className={styles.pricingNote}>
                                Book price uses Lulu print costs with a default US address. Shipping updates after you enter your address and choose a method.
                            </p>
                            {priceError && (
                                <p className={styles.reviewNote}>
                                    {priceError}
                                </p>
                            )}
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
