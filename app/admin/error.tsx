'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Admin dashboard error
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Something went wrong loading the admin dashboard. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
