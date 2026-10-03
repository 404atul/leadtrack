import Link from "next/link";
import ShaderBackground from "@/components/ui/launch";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      <ShaderBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 text-center">
        <span className="font-satoshi mb-6 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80">
          Built for performance marketing agencies
        </span>

        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Every Meta and Google
          <br />
          lead. Zero spreadsheets.
        </h1>

        <p className="font-satoshi mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
          LeadTrack captures leads from Meta and Google Ads the moment they convert, routes them to the right
          client, and gives every account manager a real-time dashboard — not another export.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="font-satoshi w-full rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition-colors duration-200 hover:bg-white/90 sm:w-auto"
          >
            Client Login
          </Link>
          <a
            href="#how-it-works"
            className="font-satoshi w-full rounded-full border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5 sm:w-auto"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
