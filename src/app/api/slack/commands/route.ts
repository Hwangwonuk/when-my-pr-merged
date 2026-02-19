import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOverviewStats } from "@/lib/stats/calculator";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { formatDuration, formatNumber, formatPercentage } from "@/lib/utils/format";
import { subDays } from "date-fns";

function verifySlackRequest(
  body: string,
  timestamp: string,
  signature: string
): boolean {
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

  if (!verifySlackRequest(body, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const command = params.get("command");
  const teamId = params.get("team_id");
  const text = params.get("text")?.trim() ?? "";

  // 팀 ID로 installation 조회
  const slack = await prisma.slackIntegration.findFirst({
    where: { teamId: teamId ?? "" },
    include: { installation: true },
  });

  if (!slack) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "이 워크스페이스에 연결된 GitHub 조직이 없습니다. 먼저 앱을 설정해주세요.",
    });
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateParams = {
    installationId: slack.installation.id,
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString(),
  };

  switch (command) {
    case "/pr-stats":
      return handlePrStats(dateParams, slack.installation.accountLogin);

    case "/pr-leaderboard":
      return handlePrLeaderboard(dateParams);

    case "/pr-stale":
      return handlePrStale(slack.installation.id);

    default:
      return NextResponse.json({
        response_type: "ephemeral",
        text: `알 수 없는 명령어: ${command}`,
      });
  }
}

async function handlePrStats(
  dateParams: { installationId: string; from: string; to: string },
  orgName: string
) {
  const overview = await getOverviewStats(dateParams);

  const blocks = [
    {
      type: "header" as const,
      text: {
        type: "plain_text" as const,
        text: `📊 ${orgName} PR 통계 (최근 30일)`,
      },
    },
    {
      type: "section" as const,
      fields: [
        {
          type: "mrkdwn" as const,
          text: `*총 PR 수*\n${formatNumber(overview.totalPRs)}개`,
        },
        {
          type: "mrkdwn" as const,
          text: `*머지된 PR*\n${formatNumber(overview.mergedPRs)}개`,
        },
        {
          type: "mrkdwn" as const,
          text: `*평균 머지 시간*\n${overview.avgTimeToMergeMs > 0 ? formatDuration(overview.avgTimeToMergeMs) : "--"}`,
        },
        {
          type: "mrkdwn" as const,
          text: `*평균 첫 리뷰 시간*\n${overview.avgTimeToFirstReviewMs > 0 ? formatDuration(overview.avgTimeToFirstReviewMs) : "--"}`,
        },
        {
          type: "mrkdwn" as const,
          text: `*머지율*\n${overview.totalPRs > 0 ? formatPercentage(overview.mergeRate, 0) : "--"}`,
        },
        {
          type: "mrkdwn" as const,
          text: `*평균 수정 횟수*\n${overview.avgRevisionCount.toFixed(1)}회`,
        },
      ],
    },
  ];

  return NextResponse.json({ response_type: "in_channel", blocks });
}

async function handlePrLeaderboard(dateParams: {
  installationId: string;
  from: string;
  to: string;
}) {
  const rankings = await getReviewerRankings({ ...dateParams, limit: 5 });

  if (rankings.length === 0) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "최근 30일간 리뷰 데이터가 없습니다.",
    });
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = rankings.map((r) => {
    const medal = r.rank <= 3 ? medals[r.rank - 1] : `${r.rank}.`;
    const time =
      r.avgResponseTimeMs > 0 ? formatDuration(r.avgResponseTimeMs) : "N/A";
    return `${medal} *${r.user.login}* — ${time} · ${r.reviewCount}건 리뷰`;
  });

  return NextResponse.json({
    response_type: "in_channel",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🏆 리뷰어 리더보드 (최근 30일)" },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: lines.join("\n") },
      },
    ],
  });
}

async function handlePrStale(installationId: string) {
  const twentyFourHoursAgo = subDays(new Date(), 1);

  const stalePRs = await prisma.pullRequest.findMany({
    where: {
      repository: { installationId },
      state: "open",
      firstReviewAt: null,
      createdAt: { lte: twentyFourHoursAgo },
    },
    include: {
      author: { select: { login: true } },
      repository: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (stalePRs.length === 0) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "🎉 방치된 PR이 없습니다! 모든 PR이 리뷰되고 있습니다.",
    });
  }

  const lines = stalePRs.map((pr) => {
    const hoursAgo = Math.round(
      (Date.now() - pr.createdAt.getTime()) / 3_600_000
    );
    return `• <https://github.com/${pr.repository.fullName}/pull/${pr.number}|#${pr.number} ${pr.title}> by ${pr.author.login} (${hoursAgo}시간 대기)`;
  });

  return NextResponse.json({
    response_type: "in_channel",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `👀 방치된 PR ${stalePRs.length}개`,
        },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: lines.join("\n") },
      },
    ],
  });
}
