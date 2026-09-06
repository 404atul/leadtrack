import CopyWebhookUrl from "./CopyWebhookUrl";

export type UnifiedCampaign = {
  platform: "meta" | "google";
  id: string;
  name: string;
  status: string;
  objective: string | null;
  budgetDisplay: string;
};

type PlatformState = {
  connected: boolean;
  error: "expired" | "generic" | null;
};

function ConnectionNotice({
  platform,
  connectHref,
  label,
  state,
}: {
  platform: string;
  connectHref: string;
  label: string;
  state: PlatformState;
}) {
  if (!state.connected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Connect {label}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Link your {label} account to see campaigns and capture leads automatically.
          </p>
        </div>
        <a
          href={connectHref}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Connect with {platform}
        </a>
      </div>
    );
  }

  if (state.error === "expired") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Your {label} connection expired</h3>
          <p className="mt-1 text-sm text-amber-700">Reconnect to keep seeing campaigns and capturing leads.</p>
        </div>
        <a
          href={connectHref}
          className="shrink-0 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Reconnect {platform}
        </a>
      </div>
    );
  }

  if (state.error === "generic") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
        Couldn&apos;t load {label} campaigns right now. Try again shortly.
      </div>
    );
  }

  return null;
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE" || status === "ENABLED";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active
          ? "bg-green-50 text-green-700 ring-green-600/20"
          : "bg-gray-100 text-gray-600 ring-gray-500/20"
      }`}
    >
      {active ? "Active" : "Paused"}
    </span>
  );
}

function PlatformTag({ platform }: { platform: "meta" | "google" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        platform === "meta" ? "text-blue-700" : "text-amber-700"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${platform === "meta" ? "bg-blue-600" : "bg-amber-500"}`} />
      {platform === "meta" ? "Meta" : "Google"}
    </span>
  );
}

export default function CampaignsSection({
  meta,
  google,
  googleWebhookUrl,
  campaigns,
}: {
  meta: PlatformState;
  google: PlatformState;
  googleWebhookUrl: string | null;
  campaigns: UnifiedCampaign[];
}) {
  const showTable = meta.connected || google.connected;

  return (
    <div className="space-y-4">
      <ConnectionNotice platform="Meta" connectHref="/api/auth/meta/connect" label="Meta Ads" state={meta} />
      <ConnectionNotice
        platform="Google Ads"
        connectHref="/api/auth/google/connect"
        label="Google Ads"
        state={google}
      />

      {google.connected && googleWebhookUrl && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-900">Google Ads lead delivery webhook</h3>
          <p className="mt-1 text-sm text-gray-500">
            Paste this into each Lead Form ad&apos;s Lead Delivery &gt; Webhook settings in Google Ads:
          </p>
          <div className="mt-3">
            <CopyWebhookUrl url={googleWebhookUrl} />
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            <li>In Google Ads, go to Ads &amp; assets &gt; Lead form extension</li>
            <li>Open the lead form and go to Lead delivery</li>
            <li>Select Webhook and paste the URL above</li>
            <li>Enter the same URL&apos;s token as the webhook key when prompted</li>
            <li>
              Click <strong>Send Test Data</strong> to verify the connection
            </li>
          </ol>
        </div>
      )}

      {showTable && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Campaigns</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3">Campaign Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Objective</th>
                <th className="px-5 py-3">Daily Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={`${campaign.platform}-${campaign.id}`} className="text-sm text-gray-700">
                    <td className="px-5 py-3">
                      <PlatformTag platform={campaign.platform} />
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{campaign.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-3">{campaign.objective ?? "—"}</td>
                    <td className="px-5 py-3">{campaign.budgetDisplay}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
