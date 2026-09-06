import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, syncAgencyFromStripeSubscription, markAgencySubscriptionCanceled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 403 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncAgencyFromStripeSubscription(subscription, session.client_reference_id ?? undefined);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncAgencyFromStripeSubscription(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await markAgencySubscriptionCanceled(subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook: failed to process event ${event.type}`, err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
