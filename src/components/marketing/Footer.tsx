import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-10 sm:flex-row">
        <p className="font-display text-sm font-semibold text-white">LeadTrack</p>
        <p className="font-satoshi text-sm text-white/40">© {new Date().getFullYear()} LeadTrack CRM. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/login" className="font-satoshi text-sm text-white/50 hover:text-white">
            Client Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
