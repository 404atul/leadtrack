import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { isAgencyActive, PLANS, type PlanKey } from "@/lib/billing";
import { formatDate } from "@/lib/utils";
import PlanButton from "./PlanButton";
import ManageBillingButton from "./ManageBillingButton";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  incomplete: "Not Started",
};

export default async function BillingPage() {
  const session = await requireAgencyAdmin({ allowInactiveBilling: true });

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId! } });
  if (!agency) {
    return <p className="text-sm text-gray-500">Agency not found.</p>;
  }

  const active = isAgencyActive(agency);
  const currentPlan = (Object.entries(PLANS).find(
    ([, plan]) => plan.priceEnvVar && process.env[plan.priceEnvVar] === agency.stripePriceId
  )?.[0] ?? null) as PlanKey | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">Manage your LeadTrack CRM subscription.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Current Status</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {STATUS_LABELS[agency.subscriptionStatus] ?? agency.subscriptionStatus}
              {currentPlan && ` — ${PLANS[currentPlan].name}`}
            </p>
            {agency.subscriptionStatus === "trialing" && agency.trialEndsAt && (
              <p className="mt-1 text-sm text-gray-500">Trial ends {formatDate(agency.trialEndsAt)}.</p>
            )}
            {agency.currentPeriodEndsAt && agency.subscriptionStatus === "active" && (
              <p className="mt-1 text-sm text-gray-500">Renews {formatDate(agency.currentPeriodEndsAt)}.</p>
            )}
            {!active && (
              <p className="mt-1 text-sm text-red-600">
                Access to LeadTrack CRM is paused. Start or renew a subscription below to continue.
              </p>
            )}
          </div>
          {agency.stripeCustomerId && <ManageBillingButton />}
        </div>
      </div>

      {(!active || !agency.stripeSubscriptionId) && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Choose a plan</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(([key, plan]) => (
              <div key={key} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  ${plan.monthlyPrice}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {plan.leadLimit ? `Up to ${plan.leadLimit} leads/mo` : "Unlimited leads"}
                </p>
                <PlanButton planKey={key} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
