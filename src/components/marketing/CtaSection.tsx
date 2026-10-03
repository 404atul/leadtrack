import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="bg-black px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Stop losing leads between platforms.
        </h2>
        <p className="font-satoshi mt-4 text-lg text-white/60">
          Every lead, one dashboard, zero spreadsheets.
        </p>
        <Link
          href="/login"
          className="font-satoshi mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition-colors duration-200 hover:bg-white/90"
        >
          Client Login
        </Link>
      </div>
    </section>
  );
}
