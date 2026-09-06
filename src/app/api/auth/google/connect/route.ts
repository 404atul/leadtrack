import { NextRequest, NextResponse } from "next/server";
import { getActiveClientSession } from "@/lib/clientAuth";
import { signState } from "@/lib/oauthState";

export const dynamic = "force-dynamic";

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const result = await getActiveClientSession();

  if (result.status === "unauthenticated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (result.status === "inactive") {
    return NextResponse.redirect(new URL("/account-paused", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google Ads integration is not configured." }, { status: 500 });
  }

  const state = signState({ clientId: result.clientId });
  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;

  const dialogUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  dialogUrl.searchParams.set("client_id", clientId);
  dialogUrl.searchParams.set("redirect_uri", redirectUri);
  dialogUrl.searchParams.set("response_type", "code");
  dialogUrl.searchParams.set("scope", GOOGLE_ADS_SCOPE);
  dialogUrl.searchParams.set("access_type", "offline");
  // Force the consent screen every time so Google always returns a refresh_token —
  // without this, a user who previously granted access gets no refresh_token at all.
  dialogUrl.searchParams.set("prompt", "consent");
  dialogUrl.searchParams.set("state", state);

  return NextResponse.redirect(dialogUrl.toString());
}
