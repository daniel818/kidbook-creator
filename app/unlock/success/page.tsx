'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function UnlockSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');
    const sessionId = searchParams.get('session_id');
    const notifiedRef = useRef(false);

    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState('Confirming your payment...');

    useEffect(() => {
        if (!bookId) {
            router.push('/');
            return;
        }

        let attempts = 0;
        const maxAttempts = 6;

        const tryUnlock = async () => {
            attempts += 1;
            try {
                const url = sessionId
                    ? `/api/books/${bookId}/unlock?session_id=${sessionId}`
                    : `/api/books/${bookId}/unlock`;
                const response = await fetch(url, { method: 'POST' });
                if (response.ok) {
                    setStatus('success');
                    setMessage('Your full book is ready.');
                    return;
                }

                const data = await response.json().catch(() => ({}));
                if (response.status === 402 && attempts < maxAttempts) {
                    setMessage('Payment confirmed. Generating your full book...');
                    setTimeout(tryUnlock, 1500);
                    return;
                }

                setStatus('error');
                setMessage(data?.error || 'Unable to unlock yet. Please refresh in a moment.');
            } catch (error) {
                setStatus('error');
                setMessage('Unable to unlock yet. Please refresh in a moment.');
            }
        };

        tryUnlock();
    }, [bookId, router]);

    useEffect(() => {
        if (!bookId) return;
        if (notifiedRef.current) return;
        if (typeof window === 'undefined') return;
        const payload = { type: 'kidbook:checkout-complete', bookId, sessionId };
        notifiedRef.current = true;

        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, window.location.origin);
            window.opener.focus();
        }

        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('kidbook-checkout');
            channel.postMessage(payload);
            channel.close();
        }

        try {
            const payloadValue = JSON.stringify({ ts: Date.now(), sessionId });
            localStorage.setItem(`kidbook:checkout:${bookId}`, payloadValue);
        } catch {
            // ignore storage failures
        }

        setTimeout(() => window.close(), 300);
        setTimeout(() => {
            window.location.href = `/book/${bookId}`;
        }, 1200);
    }, [bookId]);

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            padding: '2rem'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '2rem 2.5rem',
                maxWidth: '520px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {status === 'success' ? '✅' : status === 'error' ? '⚠️' : '✨'}
                </div>
                <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: '#111827' }}>
                    {status === 'success' ? 'Unlocked!' : status === 'error' ? 'Almost there' : 'Unlocking your book'}
                </h1>
                <p style={{ color: '#4b5563', margin: 0 }}>
                    {message}
                </p>
                {status === 'pending' && (
                    <div style={{ marginTop: '1.5rem', color: '#6b7280' }}>
                        Generating pages. This may take a few minutes.
                    </div>
                )}
                {status === 'success' && (
                    <button
                        onClick={() => router.push(`/book/${bookId}`)}
                        style={{
                            marginTop: '1.5rem',
                            background: '#111827',
                            color: '#fff',
                            border: 'none',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '999px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        View your book
                    </button>
                )}
            </div>
        </main>
    );
}

export default function UnlockSuccessPage() {
    return (
        <Suspense fallback={<div />}>
            <UnlockSuccessContent />
        </Suspense>
    );
}
