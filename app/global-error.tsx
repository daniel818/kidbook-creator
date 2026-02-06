'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
          color: '#1f2937',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            maxWidth: '480px',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📖</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4338ca' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '2rem' }}>
            We hit an unexpected bump in our story. Don&apos;t worry — let&apos;s try turning the page again!
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#6366f1',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
