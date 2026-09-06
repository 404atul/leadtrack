import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/billing";

const PLAN_ORDER = ["starter", "growth", "scale"] as const;

export default function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Simple pricing, no per-seat games
          </h2>
          <p className="font-satoshi mt-4 text-lg text-gray-500">
            Every plan includes a 14-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLAN_ORDER.map((key, i) => {
            const plan = PLANS[key];
            const featured = i === 1;
            return (
              <div
                key={key}
                className={`rounded-2xl border p-8 ${
                  featured ? "border-brand-600 bg-white shadow-lg ring-1 ring-brand-600" : "border-gray-200 bg-white"
                }`}
              >
                {featured && (
                  <span className="font-satoshi mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2">
                  <span className="font-display text-4xl font-semibold text-gray-900">${plan.monthlyPrice}</span>
                  <span className="font-satoshi text-sm text-gray-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="font-satoshi flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                    {plan.leadLimit ? `Up to ${plan.leadLimit} leads/mo` : "Unlimited leads"}
                  </li>
                  <li className="font-satoshi flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                    Unlimited clients &amp; users
                  </li>
                  <li className="font-satoshi flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                    Meta &amp; Google Ads integration
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className={`font-satoshi mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors duration-200 ${
                    featured
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
