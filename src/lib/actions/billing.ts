"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/billing";

export async function startCheckout(planKey: PlanKey) {
  const session = await requireAgencyAdmin({ allowInactiveBilling: true });

  const plan = PLANS[planKey];
  if (!plan) throw new Error("Unknown plan.");

  const priceId = process.env[plan.priceEnvVar];
  if (!priceId) throw new Error(`${plan.priceEnvVar} is not configured.`);

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId! } });
  if (!agency) throw new Error("Agency not found.");

  const url = await createCheckoutSession({
    agencyId: agency.id,
    agencyName: agency.name,
    existingStripeCustomerId: agency.stripeCustomerId,
    priceId,
    customerEmail: session.user.email ?? "",
  });

  redirect(url);
}

export async function openBillingPortal() {
  const session = await requireAgencyAdmin({ allowInactiveBilling: true });

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId! } });
  if (!agency?.stripeCustomerId) {
    throw new Error("No billing account found yet. Start a subscription first.");
  }

  const url = await createBillingPortalSession(agency.stripeCustomerId);
  redirect(url);
}
