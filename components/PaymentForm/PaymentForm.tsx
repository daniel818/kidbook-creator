'use client';

// ============================================
// PaymentForm - Embedded Stripe PaymentElement
// ============================================
// Reusable component that wraps Stripe's PaymentElement.
// Supports credit/debit cards, Apple Pay, and Google Pay inline.

import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import styles from './PaymentForm.module.css';

interface PaymentFormProps {
    /** Called before confirmPayment — e.g. generate PDFs, attach to order. Return true when ready. */
    onConfirmClick: () => Promise<boolean>;
    /** Called when payment succeeds with the PaymentIntent ID */
    onPaymentSuccess: (paymentIntentId: string) => void;
    /** Called when payment fails with an error message */
    onPaymentError: (error: string) => void;
    /** True while pre-payment preparation is running (e.g. PDF generation) */
    isPreparingOrder: boolean;
    /** Total amount in dollars for the button label */
    amount: number;
    /** URL to redirect to for redirect-based payment methods (e.g. bank transfers) */
    returnUrl: string;
    /** Disable the form (e.g. terms not accepted) */
    disabled?: boolean;
}

export default function PaymentForm({
    onConfirmClick,
    onPaymentSuccess,
    onPaymentError,
    isPreparingOrder,
    amount,
    returnUrl,
    disabled,
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setErrorMessage(null);

        // Step 1: Validate all PaymentElement fields via Stripe's built-in validation.
        // This checks card number format, expiry date, CVC length, required fields, etc.
        // If any field is empty or invalid, it returns an error and highlights the field.
        const { error: submitError } = await elements.submit();
        if (submitError) {
            const message = submitError.message || 'Please fill in all payment details correctly.';
            setErrorMessage(message);
            return;
        }

        setIsProcessing(true);

        try {
            // Step 2: Run pre-payment preparation (PDF generation + upload + attach)
            const ready = await onConfirmClick();
            if (!ready) {
                setIsProcessing(false);
                return;
            }

            // Step 3: Confirm the payment via Stripe
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: returnUrl,
                },
                // Stay on page for card/wallet payments; only redirect for bank transfers etc.
                redirect: 'if_required',
            });

            if (error) {
                // Payment failed — show error inline
                const message = error.message || 'Payment failed. Please try again.';
                setErrorMessage(message);
                onPaymentError(message);
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded — notify parent
                onPaymentSuccess(paymentIntent.id);
            }
            // If paymentIntent.status is 'requires_action', Stripe handles 3D Secure automatically
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setErrorMessage(message);
            onPaymentError(message);
            setIsProcessing(false);
        }
    };

    const isDisabled = !stripe || !elements || isProcessing || isPreparingOrder || disabled;

    const getButtonLabel = () => {
        if (isProcessing && isPreparingOrder) return 'Preparing Book...';
        if (isProcessing) return 'Processing Payment...';
        return `Pay $${amount.toFixed(2)}`;
    };

    return (
        <form onSubmit={handleSubmit} className={styles.paymentForm}>
            <div className={styles.elementWrapper}>
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto',
                        },
                    }}
                />
            </div>

            {errorMessage && (
                <div className={styles.errorMessage}>
                    ⚠️ {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={isDisabled}
                className={styles.submitButton}
            >
                {(isProcessing || isPreparingOrder) && (
                    <span className={styles.btnSpinner} />
                )}
                <span>{getButtonLabel()}</span>
                {!isProcessing && !isPreparingOrder && (
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                )}
            </button>

            <div className={styles.securedFooter}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                <span>Your payment is secured by Stripe</span>
            </div>
        </form>
    );
}
