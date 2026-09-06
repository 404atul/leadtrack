const STEPS = [
  {
    number: "01",
    title: "Connect your clients' ad accounts",
    description: "Link each client's Meta Page (Google Ads coming soon) from their client profile — takes under a minute.",
  },
  {
    number: "02",
    title: "Leads land automatically",
    description: "New form submissions arrive in LeadTrack within seconds, pre-filled with campaign, ad, and contact details.",
  },
  {
    number: "03",
    title: "Your team works the funnel",
    description: "Assign, qualify, and move leads through status — with a full history of who did what and when.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Live in minutes, not sprints
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="font-display text-sm font-semibold text-brand-600">{step.number}</span>
              <h3 className="font-display mt-3 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="font-satoshi mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
