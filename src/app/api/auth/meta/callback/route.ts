import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveClientSession } from "@/lib/clientAuth";
import { verifyState } from "@/lib/oauthState";
import { encrypt } from "@/lib/encryption";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedToken,
  fetchUserPages,
  fetchUserAdAccounts,
  saveMetaConnectionForClient,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60; // ~60 days, Meta's typical long-lived token life

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
    return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=invalid_request`);
  }

  const statePayload = verifyState<{ clientId: string }>(state);
  if (!statePayload?.clientId) {
    return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=invalid_state`);
  }

  const result = await getActiveClientSession();
  if (result.status === "unauthenticated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (result.status === "inactive") {
    return NextResponse.redirect(new URL("/account-paused", req.url));
  }
  if (result.clientId !== statePayload.clientId) {
    // Session doesn't match who initiated this OAuth flow — reject rather than
    // connecting Meta to the wrong client.
    return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=session_mismatch`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/meta/callback`;
    const shortLived = await exchangeCodeForUserToken(code, redirectUri);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    const tokenExpiresAt = new Date(
      Date.now() + (longLived.expiresIn ?? DEFAULT_TOKEN_LIFETIME_SECONDS) * 1000
    );

    const [pages, adAccounts] = await Promise.all([
      fetchUserPages(longLived.accessToken),
      fetchUserAdAccounts(longLived.accessToken),
    ]);

    if (pages.length === 0 || adAccounts.length === 0) {
      return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=no_pages_or_accounts`);
    }

    if (pages.length === 1 && adAccounts.length === 1) {
      await saveMetaConnectionForClient(result.clientId, {
        longLivedUserToken: longLived.accessToken,
        tokenExpiresAt,
        page: pages[0],
        adAccount: adAccounts[0],
      });
      return NextResponse.redirect(`${appUrl}/client/dashboard?meta_connected=1`);
    }

    const attempt = await prisma.metaConnectionAttempt.create({
      data: {
        clientId: result.clientId,
        encryptedLongLivedToken: encrypt(longLived.accessToken),
        tokenExpiresAt,
        pagesJson: pages as unknown as Prisma.InputJsonValue,
        adAccountsJson: adAccounts as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.redirect(`${appUrl}/client/connect-meta/select?attempt=${attempt.id}`);
  } catch (err) {
    console.error("Meta OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/client/dashboard?meta_error=connect_failed`);
  }
}
