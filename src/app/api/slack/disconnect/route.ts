import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { installationId } = body;

  if (!installationId) {
    return NextResponse.json({ error: "Missing installationId" }, { status: 400 });
  }

  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });

  if (!slack) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  await prisma.slackIntegration.delete({
    where: { installationId },
  });

  return NextResponse.json({ ok: true });
}
