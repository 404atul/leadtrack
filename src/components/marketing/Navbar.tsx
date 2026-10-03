"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-4 top-4 z-50 sm:inset-x-6 sm:top-6">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-xl transition-colors duration-200 sm:px-6 ${
          scrolled ? "border-white/10 bg-black/60" : "border-white/5 bg-black/30"
        }`}
      >
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-white">
          LeadTrack
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="font-satoshi text-sm text-white/70 transition-colors duration-200 hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="font-satoshi text-sm text-white/70 transition-colors duration-200 hover:text-white">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-satoshi rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-white/90"
          >
            Client Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
