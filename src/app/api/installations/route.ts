import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.member.findMany({
    where: { userId: user.userId },
    include: {
      installation: {
        include: {
          repositories: {
            select: { id: true, name: true, fullName: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  const installations = memberships.map((m) => ({
    id: m.installation.id,
    accountLogin: m.installation.accountLogin,
    accountType: m.installation.accountType,
    accountAvatarUrl: m.installation.accountAvatarUrl,
    repositories: m.installation.repositories,
  }));

  return NextResponse.json({ data: installations });
}
