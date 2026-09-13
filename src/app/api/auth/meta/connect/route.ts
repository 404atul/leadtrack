import { NextRequest, NextResponse } from "next/server";
import { getActiveClientSession } from "@/lib/clientAuth";
import { signState } from "@/lib/oauthState";

export const dynamic = "force-dynamic";

const META_OAUTH_SCOPES = [
  "ads_management",
  "ads_read",
  "leads_retrieval",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "business_management",
].join(",");

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const result = await getActiveClientSession();

  if (result.status === "unauthenticated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Meta integration is not configured." }, { status: 500 });
  }

  const state = signState({ clientId: result.clientId });
  const redirectUri = `${getAppUrl()}/api/auth/meta/callback`;

  const dialogUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
  dialogUrl.searchParams.set("client_id", appId);
  dialogUrl.searchParams.set("redirect_uri", redirectUri);
  dialogUrl.searchParams.set("state", state);
  dialogUrl.searchParams.set("scope", META_OAUTH_SCOPES);
  dialogUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(dialogUrl.toString());
}
