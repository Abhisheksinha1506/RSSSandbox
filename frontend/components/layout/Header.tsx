'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-14 sm:h-16 items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap">
              RSS Developer Suite
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
