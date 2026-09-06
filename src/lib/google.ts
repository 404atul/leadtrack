import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

const GOOGLE_ADS_API_VERSION = "v25";
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOGLE_SYSTEM_USER_ID = "system-google-integration";

export class GoogleApiError extends Error {
  status: number;
  isAuthError: boolean;

  constructor(status: number, body: unknown) {
    const message = GoogleApiError.extractMessage(body);
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
    this.isAuthError =
      status === 401 || /invalid_grant|UNAUTHENTICATED|PERMISSION_DENIED/i.test(message);
  }

  private static extractMessage(body: unknown): string {
    const b = body as {
      error?: { message?: string } | string;
      error_description?: string;
    };
    if (typeof b?.error === "string") return b.error_description ?? b.error;
    return b?.error?.message ?? "Google API error";
  }
}

function requireGoogleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return { clientId, clientSecret };
}

function requireDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not set");
  return token;
}

/* ========= OAuth token exchange ========= */

export async function exchangeGoogleCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string | null; expiresIn: number }> {
  const { clientId, clientSecret } = requireGoogleCredentials();
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new GoogleApiError(res.status, json);

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresIn: json.expires_in,
  };
}

export async function getGoogleAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = requireGoogleCredentials();
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new GoogleApiError(res.status, json);
  return json.access_token;
}

/* ========= Accessible customers ========= */

export type GoogleCustomer = { id: string; name: string };

async function listAccessibleCustomerIds(accessToken: string): Promise<string[]> {
  const res = await fetch(`${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": requireDeveloperToken(),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new GoogleApiError(res.status, json);

  const resourceNames: string[] = json.resourceNames ?? [];
  return resourceNames.map((rn) => rn.split("/")[1]).filter(Boolean);
}

async function fetchCustomerName(customerId: string, accessToken: string): Promise<string> {
  try {
    const res = await fetch(`${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": requireDeveloperToken(),
        "login-customer-id": customerId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1" }),
    });
    const json = await res.json();
    if (!res.ok) throw new GoogleApiError(res.status, json);
    const name = json.results?.[0]?.customer?.descriptiveName;
    return name || `Customer ${customerId}`;
  } catch {
    // Some accounts (e.g. manager-account-managed) reject a direct name lookup —
    // fall back to a readable placeholder rather than failing the whole connect flow.
    return `Customer ${customerId}`;
  }
}

export async function fetchAccessibleGoogleCustomers(accessToken: string): Promise<GoogleCustomer[]> {
  const ids = await listAccessibleCustomerIds(accessToken);
  return Promise.all(ids.map(async (id) => ({ id, name: await fetchCustomerName(id, accessToken) })));
}

/* ========= Campaigns ========= */

export type GoogleCampaign = {
  id: string;
  name: string;
  status: string;
  amountMicros: string | null;
};

export async function fetchGoogleCampaigns(customerId: string, accessToken: string): Promise<GoogleCampaign[]> {
  const query =
    "SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign";

  const res = await fetch(`${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": requireDeveloperToken(),
      "login-customer-id": customerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (!res.ok) throw new GoogleApiError(res.status, json);

  type SearchRow = {
    campaign?: { id?: string; name?: string; status?: string };
    campaignBudget?: { amountMicros?: string };
  };

  return ((json.results ?? []) as SearchRow[]).map((row) => ({
    id: row.campaign?.id ?? "",
    name: row.campaign?.name ?? "Untitled campaign",
    status: row.campaign?.status ?? "UNKNOWN",
    amountMicros: row.campaignBudget?.amountMicros ?? null,
  }));
}

/* ========= Connection persistence ========= */

export async function saveGoogleConnectionForClient(
  clientId: string,
  params: { refreshToken: string; customer: GoogleCustomer }
): Promise<void> {
  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { googleWebhookToken: true },
  });
  const webhookToken = existing?.googleWebhookToken ?? crypto.randomBytes(32).toString("hex");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      googleRefreshToken: encrypt(params.refreshToken),
      googleCustomerId: params.customer.id,
      googleCustomerName: params.customer.name,
      googleWebhookToken: webhookToken,
      googleConnectedAt: new Date(),
    },
  });
}

/* ========= Lead webhook payload ========= */

export type GoogleUserColumnDatum = {
  column_id?: string;
  column_name?: string;
  string_value?: string;
};

export type GoogleLeadPayload = {
  api_version?: number;
  campaign_id?: string | number;
  google_key?: string;
  lead_id?: string | number;
  form_id?: string | number;
  is_test?: boolean;
  gcl_id?: string;
  adgroup_id?: string | number;
  creative_id?: string | number;
  user_column_data?: GoogleUserColumnDatum[];
};

const NAME_KEYS = ["full_name"];
const PHONE_KEYS = ["phone_number"];
const EMAIL_KEYS = ["email"];

export function parseGoogleFieldData(columns: GoogleUserColumnDatum[] | undefined): {
  name: string;
  phone: string;
  email: string | null;
  formData: Record<string, string> | null;
} {
  const byId = new Map<string, string>();
  for (const col of columns ?? []) {
    const key = col.column_id?.toLowerCase().trim();
    const value = col.string_value?.trim();
    if (key && value) byId.set(key, value);
  }

  function pick(keys: string[]): string | undefined {
    for (const key of keys) {
      if (byId.has(key)) return byId.get(key);
    }
    return undefined;
  }

  let name = pick(NAME_KEYS);
  if (!name) {
    const first = byId.get("first_name");
    const last = byId.get("last_name");
    if (first || last) name = [first, last].filter(Boolean).join(" ");
  }

  const phone = pick(PHONE_KEYS);
  const email = pick(EMAIL_KEYS);

  const knownKeys = new Set([...NAME_KEYS, ...PHONE_KEYS, ...EMAIL_KEYS, "first_name", "last_name"]);
  const formData: Record<string, string> = {};
  for (const [key, value] of byId.entries()) {
    if (!knownKeys.has(key)) formData[key] = value;
  }

  return {
    name: name ?? "Unknown",
    phone: phone ?? "",
    email: email ?? null,
    formData: Object.keys(formData).length > 0 ? formData : null,
  };
}

async function ensureGoogleSystemUser() {
  return prisma.user.upsert({
    where: { id: GOOGLE_SYSTEM_USER_ID },
    update: {},
    create: {
      id: GOOGLE_SYSTEM_USER_ID,
      name: "Google Ads Integration",
      email: "system+google-integration@buildthegrowth.internal",
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      role: "agency_admin",
      isActive: false,
    },
  });
}

export async function createLeadFromGooglePayload(
  clientId: string,
  payload: GoogleLeadPayload
): Promise<{ created: boolean; leadId?: string }> {
  const googleLeadId = payload.lead_id !== undefined ? String(payload.lead_id) : "";
  if (!googleLeadId) {
    throw new Error("Google lead payload is missing lead_id");
  }

  const existing = await prisma.lead.findUnique({ where: { googleLeadId } });
  if (existing) {
    return { created: false, leadId: existing.id };
  }

  const systemUser = await ensureGoogleSystemUser();
  const { name, phone, email, formData } = parseGoogleFieldData(payload.user_column_data);

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          clientId,
          platform: "google",
          campaignName: "",
          adSetName: "",
          adName: "",
          name,
          phone,
          email,
          formData: formData ?? undefined,
          googleLeadId,
          rawPayload: payload as unknown as Prisma.InputJsonValue,
          status: "New",
        },
      });

      await tx.activityLog.create({
        data: {
          leadId: created.id,
          userId: systemUser.id,
          action: "Lead received via Google Ads webhook",
        },
      });

      return created;
    });

    return { created: true, leadId: lead.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existingLead = await prisma.lead.findUnique({ where: { googleLeadId } });
      return { created: false, leadId: existingLead?.id };
    }
    throw err;
  }
}
