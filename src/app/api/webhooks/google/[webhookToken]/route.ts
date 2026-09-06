import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadFromGooglePayload, type GoogleLeadPayload } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { webhookToken: string } }) {
  const client = await prisma.client.findUnique({
    where: { googleWebhookToken: params.webhookToken },
  });

  if (!client) {
    // Don't reveal whether a token ever existed.
    return new NextResponse(null, { status: 404 });
  }

  let payload: GoogleLeadPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Google Ads includes the shared "key" you configure in the webhook setup UI on
  // every request, as a second check beyond the (already-secret) URL token itself.
  if (!payload.google_key || payload.google_key !== client.googleWebhookToken) {
    console.warn(`Google webhook: google_key mismatch for client ${client.id}`);
    return NextResponse.json({ error: "Invalid key" }, { status: 403 });
  }

  if (payload.is_test) {
    // "Send Test Data" in the Google Ads UI — acknowledge without creating a real lead.
    return NextResponse.json({ received: true, test: true }, { status: 200 });
  }

  try {
    await createLeadFromGooglePayload(client.id, payload);
  } catch (err) {
    console.error(`Google webhook: failed to process lead for client ${client.id}`, err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
