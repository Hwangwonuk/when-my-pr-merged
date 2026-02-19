import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getReviewerRecommendations } from "@/lib/stats/reviewer-recommendation";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const repositoryId = searchParams.get("repositoryId");
  const installationId = searchParams.get("installationId");

  if (!repositoryId || !installationId) {
    return NextResponse.json(
      { error: "repositoryId and installationId are required" },
      { status: 400 }
    );
  }

  const recommendations = await getReviewerRecommendations({
    repositoryId,
    authorId: user.userId,
    installationId,
  });

  return NextResponse.json({ data: recommendations });
}
