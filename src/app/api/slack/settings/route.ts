import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = [
  "stalePrAlertEnabled",
  "autoPraiseEnabled",
  "hotStreakAlertEnabled",
  "weeklyReportEnabled",
  "dailyDigestEnabled",
  "stalePrThresholdHours",
] as const;

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { installationId, field, value } = body;

  if (!installationId || !field) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });

  if (!slack) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  await prisma.slackIntegration.update({
    where: { installationId },
    data: { [field]: value },
  });

  return NextResponse.json({ ok: true });
}
