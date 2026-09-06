import Stripe from "stripe";
import type { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(params: {
  agencyId: string;
  agencyName: string;
  existingStripeCustomerId: string | null;
  priceId: string;
  customerEmail: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.existingStripeCustomerId ?? undefined,
    customer_email: params.existingStripeCustomerId ? undefined : params.customerEmail,
    client_reference_id: params.agencyId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { agencyId: params.agencyId },
    },
    metadata: { agencyId: params.agencyId },
    allow_promotion_codes: true,
    success_url: `${getAppUrl()}/admin/billing?checkout=success`,
    cancel_url: `${getAppUrl()}/admin/billing?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createBillingPortalSession(stripeCustomerId: string): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getAppUrl()}/admin/billing`,
  });

  return session.url;
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
      return "canceled";
    case "incomplete":
    default:
      return "incomplete";
  }
}

export async function syncAgencyFromStripeSubscription(
  subscription: Stripe.Subscription,
  fallbackAgencyId?: string
): Promise<void> {
  const agencyId = subscription.metadata?.agencyId ?? fallbackAgencyId;
  if (!agencyId) {
    console.warn("Stripe webhook: subscription has no agencyId metadata, skipping", subscription.id);
    return;
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    console.warn(`Stripe webhook: no agency found for id ${agencyId}, skipping`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  await prisma.agency.update({
    where: { id: agencyId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: mapStripeStatus(subscription.status),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEndsAt: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
    },
  });
}

export async function markAgencySubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
  const agencyId = subscription.metadata?.agencyId;
  if (!agencyId) return;

  await prisma.agency.updateMany({
    where: { id: agencyId },
    data: { subscriptionStatus: "canceled" },
  });
}
