import { NextRequest, NextResponse } from "next/server";
import { getHourlyPatterns, getDailyPatterns } from "@/lib/stats/patterns";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const querySchema = z.object({
  installationId: z.string(),
  repositoryId: z.string().optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  type: z.enum(["hourly", "daily"]),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  const data =
    parsed.data.type === "hourly"
      ? await getHourlyPatterns(parsed.data)
      : await getDailyPatterns(parsed.data);

  return NextResponse.json({ data });
}
