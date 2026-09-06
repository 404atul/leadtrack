import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMetaSignature, fetchLeadDetail, createLeadFromMetaDetail, resolveClientMetaToken } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse(null, { status: 403 });
}

type MetaWebhookChange = {
  field: string;
  value?: {
    leadgen_id?: string;
    page_id?: string;
    form_id?: string;
  };
};

type MetaWebhookEntry = {
  id?: string;
  changes?: MetaWebhookChange[];
};

type MetaWebhookPayload = {
  object?: string;
  entry?: MetaWebhookEntry[];
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const leadgenId = change.value?.leadgen_id;
      const pageId = change.value?.page_id ?? entry.id;

      if (!leadgenId || !pageId) {
        console.warn("Meta webhook: leadgen change missing leadgen_id or page_id", change);
        continue;
      }

      try {
        const client = await prisma.client.findFirst({ where: { metaPageId: pageId } });
        if (!client) {
          console.warn(`Meta webhook: no client found for page ${pageId}, skipping lead ${leadgenId}`);
          continue;
        }

        const existing = await prisma.lead.findUnique({ where: { leadgenId } });
        if (existing) {
          continue;
        }

        const accessToken = resolveClientMetaToken(client);
        if (!accessToken) {
          console.warn(`Meta webhook: no access token available for client ${client.id}, skipping lead ${leadgenId}`);
          continue;
        }

        const detail = await fetchLeadDetail(leadgenId, accessToken);
        await createLeadFromMetaDetail(client.id, detail, "Lead received via Meta webhook");
      } catch (err) {
        console.error(`Meta webhook: failed to process lead ${leadgenId}`, err);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
