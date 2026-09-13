import { Zap, RefreshCcw, LayoutDashboard, Users, ShieldCheck } from "lucide-react";

const PLATFORM_CARDS = [
  {
    name: "Meta Ads",
    accent: "bg-blue-600",
    status: "Live",
    description:
      "Lead Ads forms connect straight to your clients' campaigns. Webhooks capture every submission in real time, with a 24-hour reconciliation sync as a safety net.",
    points: ["Instant webhook capture", "Automatic client routing by Page ID", "Duplicate-safe reconciliation sync"],
  },
  {
    name: "Google Ads",
    accent: "bg-amber-500",
    status: "Coming soon",
    description:
      "Google Ads lead form extensions and call tracking, unified into the same pipeline as Meta — one dashboard for every platform your clients run.",
    points: ["Lead form extensions", "Unified lead record", "Same activity timeline as Meta"],
  },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "One dashboard, every client",
    description: "Switch between client accounts instantly, or see agency-wide performance in a single view.",
  },
  {
    icon: RefreshCcw,
    title: "Full activity timeline",
    description: "Every status change, assignment, and platform event is logged automatically — no manual notes.",
  },
  {
    icon: Users,
    title: "Client portals included",
    description: "Give each client a read-only login scoped to just their own leads and funnel.",
  },
  {
    icon: ShieldCheck,
    title: "Agency-level isolation",
    description: "Every client, lead, and user is scoped to your agency. Nothing crosses tenant boundaries.",
  },
  {
    icon: Zap,
    title: "Inline lead management",
    description: "Update status, quality, and assignment right from the leads table — no page reloads.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-gray-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Ad platform native. Agency built.
          </h2>
          <p className="font-satoshi mt-4 text-lg text-gray-500">
            LeadTrack was built specifically for agencies running paid leads on Meta and Google — not retrofitted
            from a generic CRM.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {PLATFORM_CARDS.map((platform) => (
            <div key={platform.name} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${platform.accent}`} />
                  <h3 className="font-display text-xl font-semibold text-gray-900">{platform.name}</h3>
                </div>
                <span
                  className={`font-satoshi rounded-full px-3 py-1 text-xs font-medium ${
                    platform.status === "Live"
                      ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                      : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                  }`}
                >
                  {platform.status}
                </span>
              </div>
              <p className="font-satoshi mt-4 text-sm leading-relaxed text-gray-600">{platform.description}</p>
              <ul className="mt-6 space-y-2.5">
                {platform.points.map((point) => (
                  <li key={point} className="font-satoshi flex items-start gap-2.5 text-sm text-gray-700">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${platform.accent}`} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <feature.icon className="h-6 w-6 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="font-display mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="font-satoshi mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
