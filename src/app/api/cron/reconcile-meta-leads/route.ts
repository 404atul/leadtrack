import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPageLeadForms, fetchFormLeadsSince, createLeadFromMetaDetail, resolveClientMetaToken } from "@/lib/meta";

export const dynamic = "force-dynamic";

const LOOKBACK_SECONDS = 24 * 60 * 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { metaPageId: { not: null } },
  });

  const sinceUnix = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;

  const summary = {
    clientsProcessed: 0,
    leadsInserted: 0,
    errors: [] as string[],
  };

  for (const client of clients) {
    if (!client.metaPageId) continue;
    summary.clientsProcessed += 1;

    const accessToken = resolveClientMetaToken(client);
    if (!accessToken) {
      const message = `Client ${client.id} (page ${client.metaPageId}): no access token available`;
      console.warn("Meta reconciliation:", message);
      summary.errors.push(message);
      continue;
    }

    try {
      const forms = await fetchPageLeadForms(client.metaPageId, accessToken);

      for (const form of forms) {
        try {
          const leads = await fetchFormLeadsSince(form.id, sinceUnix, accessToken);

          for (const detail of leads) {
            try {
              const result = await createLeadFromMetaDetail(
                client.id,
                detail,
                "Lead backfilled via Meta reconciliation sync"
              );
              if (result.created) summary.leadsInserted += 1;
            } catch (err) {
              const message = `Client ${client.id} form ${form.id} lead ${detail.id}: ${
                err instanceof Error ? err.message : String(err)
              }`;
              console.error("Meta reconciliation error:", message);
              summary.errors.push(message);
            }
          }
        } catch (err) {
          const message = `Client ${client.id} form ${form.id}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          console.error("Meta reconciliation error:", message);
          summary.errors.push(message);
        }
      }
    } catch (err) {
      const message = `Client ${client.id} (page ${client.metaPageId}): ${
        err instanceof Error ? err.message : String(err)
      }`;
      console.error("Meta reconciliation error:", message);
      summary.errors.push(message);
    }
  }

  return NextResponse.json(summary, { status: 200 });
}
