import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, type Client } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

const META_GRAPH_VERSION = "v25.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

const SYSTEM_USER_ID = "system-meta-integration";

export type MetaFieldDatum = {
  name: string;
  values?: string[];
};

export type MetaLeadDetail = {
  id: string;
  created_time?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  field_data?: MetaFieldDatum[];
};

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
};

export type MetaAdAccount = {
  id: string;
  name: string;
};

export type MetaCampaign = {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
};

export class MetaApiError extends Error {
  status: number;
  metaCode: number | null;
  metaSubcode: number | null;

  constructor(status: number, body: unknown) {
    const err = (body as { error?: { message?: string; code?: number; error_subcode?: number } })?.error;
    super(err?.message ?? `Graph API error (${status})`);
    this.name = "MetaApiError";
    this.status = status;
    this.metaCode = err?.code ?? null;
    this.metaSubcode = err?.error_subcode ?? null;
  }

  /** True when Meta reports an expired/invalid OAuth token (code 190). */
  get isAuthError(): boolean {
    return this.metaCode === 190 || this.status === 401;
  }
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader) return false;

  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256" || !signature) return false;

  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function buildGraphUrl(path: string, params: Record<string, string>, accessToken: string): string {
  const url = new URL(`${META_GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}

async function graphGet<T>(path: string, params: Record<string, string>, accessToken: string): Promise<T> {
  const url = buildGraphUrl(path, params, accessToken);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new MetaApiError(res.status, json);
  }
  return json as T;
}

async function graphGetAllPages<T>(initialUrl: string, maxPages = 5): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = initialUrl;
  let pages = 0;

  while (url && pages < maxPages) {
    const res: Response = await fetch(url);
    const json: { data?: T[]; paging?: { next?: string } } = await res.json();
    if (!res.ok) {
      throw new MetaApiError(res.status, json);
    }
    results.push(...(json.data ?? []));
    url = json.paging?.next;
    pages += 1;
  }

  return results;
}

/**
 * Resolves the access token to use for a given client's Meta API calls:
 * the client's own decrypted token if connected, else the legacy global
 * system-user token (kept only for backward compatibility with test data).
 */
export function resolveClientMetaToken(client: Pick<Client, "metaUserAccessToken">): string | null {
  if (client.metaUserAccessToken) {
    try {
      return decrypt(client.metaUserAccessToken);
    } catch (err) {
      console.error("Failed to decrypt client Meta token", err);
      return null;
    }
  }
  return process.env.META_SYSTEM_USER_TOKEN ?? null;
}

const LEAD_FIELDS = "id,created_time,ad_id,adset_id,campaign_id,form_id,field_data";

export async function fetchLeadDetail(leadgenId: string, accessToken: string): Promise<MetaLeadDetail> {
  return graphGet<MetaLeadDetail>(`/${leadgenId}`, { fields: LEAD_FIELDS }, accessToken);
}

export async function fetchPageLeadForms(
  pageId: string,
  accessToken: string
): Promise<{ id: string; name?: string }[]> {
  const url = buildGraphUrl(`/${pageId}/leadgen_forms`, { fields: "id,name" }, accessToken);
  return graphGetAllPages(url);
}

export async function fetchFormLeadsSince(
  formId: string,
  sinceUnix: number,
  accessToken: string
): Promise<MetaLeadDetail[]> {
  const url = buildGraphUrl(
    `/${formId}/leads`,
    { fields: LEAD_FIELDS, since: String(sinceUnix) },
    accessToken
  );
  return graphGetAllPages(url);
}

export async function fetchAdAccountCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  const url = buildGraphUrl(
    `/${adAccountId}/campaigns`,
    { fields: "name,status,objective,daily_budget" },
    accessToken
  );
  return graphGetAllPages<MetaCampaign>(url);
}

/* ========= OAuth connect flow ========= */

function requireAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId) throw new Error("META_APP_ID is not set");
  if (!appSecret) throw new Error("META_APP_SECRET is not set");
  return { appId, appSecret };
}

export async function exchangeCodeForUserToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number | null }> {
  const { appId, appSecret } = requireAppCredentials();
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new MetaApiError(res.status, json);

  return { accessToken: json.access_token, expiresIn: json.expires_in ?? null };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number | null }> {
  const { appId, appSecret } = requireAppCredentials();
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new MetaApiError(res.status, json);

  return { accessToken: json.access_token, expiresIn: json.expires_in ?? null };
}

export async function fetchUserPages(userAccessToken: string): Promise<MetaPage[]> {
  const url = buildGraphUrl("/me/accounts", { fields: "id,name,access_token" }, userAccessToken);
  return graphGetAllPages<MetaPage>(url);
}

export async function fetchUserAdAccounts(userAccessToken: string): Promise<MetaAdAccount[]> {
  const url = buildGraphUrl("/me/adaccounts", { fields: "id,name" }, userAccessToken);
  return graphGetAllPages<MetaAdAccount>(url);
}

export async function subscribePageToLeadgen(pageId: string, pageAccessToken: string): Promise<void> {
  const url = buildGraphUrl(`/${pageId}/subscribed_apps`, { subscribed_fields: "leadgen" }, pageAccessToken);
  const res = await fetch(url, { method: "POST" });
  const json = await res.json();
  if (!res.ok) throw new MetaApiError(res.status, json);
}

export async function saveMetaConnectionForClient(
  clientId: string,
  params: {
    longLivedUserToken: string;
    tokenExpiresAt: Date;
    page: { id: string; name: string; access_token: string };
    adAccount: { id: string; name: string };
  }
): Promise<void> {
  // Subscribe the page to leadgen webhooks before persisting, so a failure here
  // (bad permissions, revoked page token) surfaces to the user instead of silently
  // saving a connection that will never receive leads.
  await subscribePageToLeadgen(params.page.id, params.page.access_token);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      metaUserAccessToken: encrypt(params.longLivedUserToken),
      metaTokenExpiresAt: params.tokenExpiresAt,
      metaPageId: params.page.id,
      metaPageName: params.page.name,
      metaAdAccountId: params.adAccount.id,
      metaAdAccountName: params.adAccount.name,
      metaConnectedAt: new Date(),
    },
  });
}

/* ========= Lead ingestion (webhook + reconciliation) ========= */

const NAME_KEYS = ["full_name", "name"];
const PHONE_KEYS = ["phone_number", "phone"];
const EMAIL_KEYS = ["email"];

export function parseMetaFieldData(fieldData: MetaFieldDatum[] | undefined): {
  name: string;
  phone: string;
  email: string | null;
  formData: Record<string, string> | null;
} {
  const byName = new Map<string, string>();
  for (const field of fieldData ?? []) {
    const key = field.name?.toLowerCase().trim();
    const value = field.values?.[0]?.trim();
    if (key && value) byName.set(key, value);
  }

  function pick(keys: string[]): string | undefined {
    for (const key of keys) {
      if (byName.has(key)) return byName.get(key);
    }
    return undefined;
  }

  let name = pick(NAME_KEYS);
  if (!name) {
    const first = byName.get("first_name");
    const last = byName.get("last_name");
    if (first || last) name = [first, last].filter(Boolean).join(" ");
  }

  const phone = pick(PHONE_KEYS);
  const email = pick(EMAIL_KEYS);

  const knownKeys = new Set([...NAME_KEYS, ...PHONE_KEYS, ...EMAIL_KEYS, "first_name", "last_name"]);
  const formData: Record<string, string> = {};
  for (const [key, value] of byName.entries()) {
    if (!knownKeys.has(key)) formData[key] = value;
  }

  return {
    name: name ?? "Unknown",
    phone: phone ?? "",
    email: email ?? null,
    formData: Object.keys(formData).length > 0 ? formData : null,
  };
}

async function ensureSystemUser() {
  return prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      name: "Meta Integration",
      email: "system+meta-integration@buildthegrowth.internal",
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      role: "agency_admin",
      isActive: false,
    },
  });
}

export async function createLeadFromMetaDetail(
  clientId: string,
  detail: MetaLeadDetail,
  activityMessage: string
): Promise<{ created: boolean; leadId?: string }> {
  const existing = await prisma.lead.findUnique({ where: { leadgenId: detail.id } });
  if (existing) {
    return { created: false, leadId: existing.id };
  }

  const systemUser = await ensureSystemUser();
  const { name, phone, email, formData } = parseMetaFieldData(detail.field_data);

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          clientId,
          platform: "meta",
          campaignName: "",
          adSetName: "",
          adName: "",
          name,
          phone,
          email,
          formData: formData ?? undefined,
          leadgenId: detail.id,
          rawPayload: detail as unknown as Prisma.InputJsonValue,
          status: "New",
        },
      });

      await tx.activityLog.create({
        data: {
          leadId: created.id,
          userId: systemUser.id,
          action: activityMessage,
        },
      });

      return created;
    });

    return { created: true, leadId: lead.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existingLead = await prisma.lead.findUnique({ where: { leadgenId: detail.id } });
      return { created: false, leadId: existingLead?.id };
    }
    throw err;
  }
}
