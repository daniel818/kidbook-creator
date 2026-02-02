'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-indigo-100 py-12 px-6" role="contentinfo">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#f4258c]/20 p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#f4258c] text-xl font-bold">auto_stories</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#1c0d14]">KidBook Creator</span>
        </div>
        <nav className="flex gap-8 text-sm font-medium opacity-60">
          <Link className="hover:text-[#f4258c]" href="/about">About Us</Link>
          <Link className="hover:text-[#f4258c]" href="/faq">Support</Link>
          <Link className="hover:text-[#f4258c]" href="/privacy">Privacy</Link>
          <Link className="hover:text-[#f4258c]" href="/terms">Terms</Link>
        </nav>
        <p className="text-sm opacity-40">© {new Date().getFullYear()} KidBook Creator V2. All rights reserved.</p>
      </div>
    </footer>
  );
}
