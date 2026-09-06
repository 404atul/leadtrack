import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveClientSession } from "@/lib/clientAuth";
import { verifyState } from "@/lib/oauthState";
import { encrypt } from "@/lib/encryption";
import {
  exchangeGoogleCodeForTokens,
  fetchAccessibleGoogleCustomers,
  saveGoogleConnectionForClient,
} from "@/lib/google";

export const dynamic = "force-dynamic";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=invalid_request`);
  }

  const statePayload = verifyState<{ clientId: string }>(state);
  if (!statePayload?.clientId) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=invalid_state`);
  }

  const result = await getActiveClientSession();
  if (result.status === "unauthenticated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (result.status === "inactive") {
    return NextResponse.redirect(new URL("/account-paused", req.url));
  }
  if (result.clientId !== statePayload.clientId) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=session_mismatch`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokens = await exchangeGoogleCodeForTokens(code, redirectUri);

    if (!tokens.refreshToken) {
      // Google only issues a refresh_token on first consent for this client+scope.
      // We always send prompt=consent, so this should be rare — but if it happens,
      // force a fresh consent round-trip rather than saving a connection with no
      // way to get new access tokens later.
      return NextResponse.redirect(new URL("/api/auth/google/connect", appUrl).toString());
    }

    const customers = await fetchAccessibleGoogleCustomers(tokens.accessToken);

    if (customers.length === 0) {
      return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=no_accounts`);
    }

    if (customers.length === 1) {
      await saveGoogleConnectionForClient(result.clientId, {
        refreshToken: tokens.refreshToken,
        customer: customers[0],
      });
      return NextResponse.redirect(`${appUrl}/client/dashboard?google_connected=1`);
    }

    const attempt = await prisma.googleConnectionAttempt.create({
      data: {
        clientId: result.clientId,
        encryptedRefreshToken: encrypt(tokens.refreshToken),
        customersJson: customers as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.redirect(`${appUrl}/client/connect-google/select?attempt=${attempt.id}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/client/dashboard?google_error=connect_failed`);
  }
}
