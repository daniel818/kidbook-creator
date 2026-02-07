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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5f7] dark:bg-[#221019] font-display px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">⚙️</div>
        <h2 className="text-3xl font-black text-[#1c0d14] dark:text-white mb-3">
          Admin dashboard error
        </h2>
        <p className="text-[#9c4973] dark:text-pink-100/70 text-lg mb-10 leading-relaxed">
          Something went wrong loading the admin dashboard. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[#f4258c] text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl shadow-[#f4258c]/40 hover:scale-105 transition-transform"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
