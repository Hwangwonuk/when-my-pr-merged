import { createHmac, timingSafeEqual } from "crypto";

export function verifyGitHubWebhook(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
