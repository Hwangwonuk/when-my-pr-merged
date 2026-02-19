import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getMergePrediction } from "@/lib/stats/predictions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ prId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prId } = await params;

  const pr = await prisma.pullRequest.findUnique({
    where: { id: prId },
    include: { repository: true },
  });

  if (!pr) {
    return NextResponse.json({ error: "PR not found" }, { status: 404 });
  }

  const prediction = await getMergePrediction({
    prId,
    installationId: pr.repository.installationId,
  });

  if (!prediction) {
    return NextResponse.json(
      { error: "Unable to generate prediction" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: prediction });
}
