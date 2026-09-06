import type { SubscriptionStatus } from "@prisma/client";

export const TRIAL_DAYS = 14;

export type AgencyBillingState = {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
};

export function isAgencyActive(agency: AgencyBillingState): boolean {
  if (agency.subscriptionStatus === "trialing") {
    return !agency.trialEndsAt || agency.trialEndsAt.getTime() > Date.now();
  }
  return agency.subscriptionStatus === "active" || agency.subscriptionStatus === "past_due";
}

export type PlanKey = "starter" | "growth" | "scale";

export const PLANS: Record<PlanKey, { name: string; priceEnvVar: string; monthlyPrice: number; leadLimit: number | null }> = {
  starter: {
    name: "Starter",
    priceEnvVar: "STRIPE_PRICE_ID_STARTER",
    monthlyPrice: 49,
    leadLimit: 200,
  },
  growth: {
    name: "Growth",
    priceEnvVar: "STRIPE_PRICE_ID_GROWTH",
    monthlyPrice: 149,
    leadLimit: 1000,
  },
  scale: {
    name: "Scale",
    priceEnvVar: "STRIPE_PRICE_ID_SCALE",
    monthlyPrice: 399,
    leadLimit: null,
  },
};
