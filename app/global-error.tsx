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
          fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#f8f5f7',
          color: '#1c0d14',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            maxWidth: '480px',
          }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📖</div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '0.75rem', color: '#1c0d14' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#9c4973', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            We hit an unexpected bump in our story. Don&apos;t worry — let&apos;s try turning the page again!
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#f4258c',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 25px 50px -12px rgba(244, 37, 140, 0.4)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
