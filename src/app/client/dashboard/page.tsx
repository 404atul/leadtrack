import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import { LEAD_STATUSES, formatStatusLabel, formatDate } from "@/lib/utils";
import { StatusBadge, QualityBadge } from "@/components/Badges";
import { decrypt } from "@/lib/encryption";
import { fetchAdAccountCampaigns, MetaApiError } from "@/lib/meta";
import { fetchGoogleCampaigns, getGoogleAccessTokenFromRefreshToken, GoogleApiError } from "@/lib/google";
import DashboardTabs from "./DashboardTabs";
import CampaignsSection, { type UnifiedCampaign } from "./CampaignsSection";
import ConnectFeedbackBanner from "./ConnectFeedbackBanner";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: {
    meta_connected?: string;
    meta_error?: string;
    google_connected?: string;
    google_error?: string;
  };
}) {
  const session = await requireClientUser();
  const clientId = session.user.clientId!;

  const [leads, statusCounts, client] = await Promise.all([
    prisma.lead.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { clientId },
      _count: { _all: true },
    }),
    prisma.client.findUnique({ where: { id: clientId } }),
  ]);

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]));

  const metaConnected = Boolean(client?.metaUserAccessToken && client.metaAdAccountId);
  let metaError: "expired" | "generic" | null = null;
  const unifiedCampaigns: UnifiedCampaign[] = [];

  if (metaConnected && client) {
    try {
      const token = decrypt(client.metaUserAccessToken!);
      const metaCampaigns = await fetchAdAccountCampaigns(client.metaAdAccountId!, token);
      for (const c of metaCampaigns) {
        unifiedCampaigns.push({
          platform: "meta",
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective ?? null,
          budgetDisplay: c.daily_budget ? `$${(Number(c.daily_budget) / 100).toFixed(2)}/day` : "—",
        });
      }
    } catch (err) {
      if (err instanceof MetaApiError && err.isAuthError) {
        metaError = "expired";
      } else {
        metaError = "generic";
        console.error("Failed to fetch Meta campaigns for client", clientId, err);
      }
    }
  }

  const googleConnected = Boolean(client?.googleRefreshToken && client.googleCustomerId);
  let googleError: "expired" | "generic" | null = null;

  if (googleConnected && client) {
    try {
      const refreshToken = decrypt(client.googleRefreshToken!);
      const accessToken = await getGoogleAccessTokenFromRefreshToken(refreshToken);
      const googleCampaigns = await fetchGoogleCampaigns(client.googleCustomerId!, accessToken);
      for (const c of googleCampaigns) {
        unifiedCampaigns.push({
          platform: "google",
          id: c.id,
          name: c.name,
          status: c.status,
          objective: null,
          budgetDisplay: c.amountMicros ? `$${(Number(c.amountMicros) / 1_000_000).toFixed(2)}/day` : "—",
        });
      }
    } catch (err) {
      if (err instanceof GoogleApiError && err.isAuthError) {
        googleError = "expired";
      } else {
        googleError = "generic";
        console.error("Failed to fetch Google Ads campaigns for client", clientId, err);
      }
    }
  }

  const googleWebhookUrl = client?.googleWebhookToken
    ? `${getAppUrl()}/api/webhooks/google/${client.googleWebhookToken}`
    : null;

  const funnelSection = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {LEAD_STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{formatStatusLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{countByStatus.get(status) ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Your Leads</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Platform</th>
              <th className="px-5 py-3">Campaign</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Quality</th>
              <th className="px-5 py-3">Assigned To</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">
                  No leads yet.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="text-sm text-gray-700">
                <td className="px-5 py-3 capitalize">{lead.platform}</td>
                <td className="px-5 py-3">{lead.campaignName}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{lead.name}</td>
                <td className="px-5 py-3">{lead.phone}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3">
                  <QualityBadge quality={lead.quality} />
                </td>
                <td className="px-5 py-3">{lead.assignee?.name ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const campaignsSection = (
    <CampaignsSection
      meta={{ connected: metaConnected, error: metaError }}
      google={{ connected: googleConnected, error: googleError }}
      googleWebhookUrl={googleWebhookUrl}
      campaigns={unifiedCampaigns}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Your lead funnel and connected ad accounts.</p>
      </div>

      <ConnectFeedbackBanner
        platform="Meta"
        connected={searchParams.meta_connected === "1"}
        error={searchParams.meta_error ?? null}
      />
      <ConnectFeedbackBanner
        platform="Google Ads"
        connected={searchParams.google_connected === "1"}
        error={searchParams.google_error ?? null}
      />

      <DashboardTabs funnel={funnelSection} campaigns={campaignsSection} />
    </div>
  );
}
