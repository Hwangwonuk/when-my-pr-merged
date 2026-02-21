import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { syncHistoricalData } from "@/lib/github/sync";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const installationId = body?.installationId;
  if (!installationId || typeof installationId !== "string") {
    return NextResponse.json(
      { error: "installationId is required" },
      { status: 400 }
    );
  }

  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  if (!installation) {
    return NextResponse.json(
      { error: "Installation not found" },
      { status: 404 }
    );
  }

  if (installation.syncStatus === "syncing") {
    return NextResponse.json(
      { error: "이미 동기화가 진행 중입니다" },
      { status: 409 }
    );
  }

  // Fire-and-forget: same pattern as installation handler
  syncHistoricalData(installation.githubInstallId, installation.id).catch(
    (err) => console.error("Resync failed:", err)
  );

  return NextResponse.json({ ok: true });
}
