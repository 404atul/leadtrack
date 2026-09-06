import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

export function signState(payload: Record<string, unknown>): string {
  const body = { ...payload, exp: Date.now() + STATE_TTL_MS };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyState<T extends Record<string, unknown>>(state: string): T | null {
  const [data, signature] = state.split(".");
  if (!data || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T & { exp?: number };
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
