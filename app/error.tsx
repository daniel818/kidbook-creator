'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PageError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-100 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-indigo-700 mb-3">
          Something went wrong
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Our magical book machine had a hiccup. Let&apos;s give it another try!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl border-2 border-indigo-200 hover:border-indigo-300 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
