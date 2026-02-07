import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5f7] dark:bg-[#221019] font-display px-4 relative overflow-hidden">
      {/* Floating background shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#f4258c]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="text-center max-w-md relative z-10">
        <span className="material-symbols-outlined text-[#f4258c] mb-6 block" style={{ fontSize: '5rem' }} aria-hidden="true">search_off</span>
        <h2 className="text-3xl font-black text-[#1c0d14] dark:text-white mb-3">
          Page not found
        </h2>
        <p className="text-[#9c4973] dark:text-pink-100/70 text-lg mb-10 leading-relaxed">
          This page seems to have wandered off on its own adventure. Let&apos;s get you back on track!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#f4258c] text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl shadow-[#f4258c]/40 hover:scale-105 transition-transform"
          >
            Go home
          </Link>
          <Link
            href="/create"
            className="bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 px-8 py-4 rounded-full text-lg font-bold border-2 border-indigo-200 dark:border-indigo-500/30 hover:scale-105 transition-transform"
          >
            Create a book
          </Link>
        </div>
      </div>
    </div>
  );
}
