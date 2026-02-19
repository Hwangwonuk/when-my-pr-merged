import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

function verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!;
  const baseString = `v0:${timestamp}:${body}`;
  const expected = `v0=${createHmac("sha256", signingSecret).update(baseString).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
  const signature = req.headers.get("x-slack-signature") ?? "";

  // Verify request
  if (!verifySlackRequest(body, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Handle URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle slash commands and interactive components
  if (payload.type === "event_callback") {
    // Process events
    console.log("Slack event:", payload.event?.type);
  }

  return NextResponse.json({ ok: true });
}
