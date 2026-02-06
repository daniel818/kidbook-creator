'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CreateError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold text-orange-700 mb-3">
          Something went wrong while creating your book
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Our story painters need a moment to regroup. You can try again or check your existing books.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
          >
            Start over
          </button>
          <Link
            href="/mybooks"
            className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-colors"
          >
            Go to my books
          </Link>
        </div>
      </div>
    </div>
  );
}
