import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔮</div>
        <h2 className="text-2xl font-bold text-purple-700 mb-3">
          Page not found
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          This page seems to have wandered off on its own adventure. Let&apos;s get you back on track!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/create"
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors"
          >
            Create a book
          </Link>
        </div>
      </div>
    </div>
  );
}
