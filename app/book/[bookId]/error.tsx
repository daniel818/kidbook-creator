'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[BookViewerError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-blue-700 mb-3">
          We couldn&apos;t load this book
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          This page seems to have gone missing from the library. Let&apos;s find it again!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/mybooks"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors"
          >
            Go to my books
          </Link>
        </div>
      </div>
    </div>
  );
}
