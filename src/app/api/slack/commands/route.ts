import { NextRequest, NextResponse, after } from "next/server";
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

async function sendDeferredResponse(
  responseUrl: string,
  body: Record<string, unknown>
) {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  const responseUrl = params.get("response_url") ?? "";

  // 팀 ID로 installation 조회
  const slack = await prisma.slackIntegration.findFirst({
    where: { teamId: teamId ?? "" },
    include: { installation: true },
  });

  console.log("[slack-commands] teamId:", teamId, "slack:", slack?.id, "installationId:", slack?.installation.id, "accountLogin:", slack?.installation.accountLogin);

  if (!slack) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "이 워크스페이스에 연결된 GitHub 조직이 없습니다. 먼저 앱을 설정해주세요.",
    });
  }

  // 해당 installation에 연결된 데이터 확인
  const [repoCount, prCount] = await Promise.all([
    prisma.repository.count({ where: { installationId: slack.installation.id } }),
    prisma.pullRequest.count({ where: { repository: { installationId: slack.installation.id } } }),
  ]);
  console.log("[slack-commands] installationId:", slack.installation.id, "repos:", repoCount, "prs:", prCount);

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateParams = {
    installationId: slack.installation.id,
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString(),
  };

  // /pr-stale은 가벼운 쿼리라 즉시 응답, 나머지는 after()로 deferred response
  switch (command) {
    case "/pr-stats":
      after(async () => {
        await handlePrStatsDeferred(dateParams, slack.installation.accountLogin, responseUrl);
      });
      return NextResponse.json({
        response_type: "ephemeral",
        text: ":hourglass_flowing_sand: PR 통계를 조회 중입니다...",
      });

    case "/pr-leaderboard":
      after(async () => {
        await handlePrLeaderboardDeferred(dateParams, responseUrl);
      });
      return NextResponse.json({
        response_type: "ephemeral",
        text: ":hourglass_flowing_sand: 리더보드를 조회 중입니다...",
      });

    case "/pr-stale":
      return handlePrStale(slack.installation.id);

    default:
      return NextResponse.json({
        response_type: "ephemeral",
        text: `알 수 없는 명령어: ${command}`,
      });
  }
}

async function handlePrStatsDeferred(
  dateParams: { installationId: string; from: string; to: string },
  orgName: string,
  responseUrl: string
) {
  try {
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

    await sendDeferredResponse(responseUrl, { response_type: "in_channel", blocks });
  } catch (error) {
    console.error("[/pr-stats] error:", error);
    await sendDeferredResponse(responseUrl, {
      response_type: "ephemeral",
      text: "통계 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

async function handlePrLeaderboardDeferred(
  dateParams: { installationId: string; from: string; to: string },
  responseUrl: string
) {
  try {
    const rankings = await getReviewerRankings({ ...dateParams, limit: 5 });

    if (rankings.length === 0) {
      await sendDeferredResponse(responseUrl, {
        response_type: "ephemeral",
        text: "최근 30일간 리뷰 데이터가 없습니다.",
      });
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = rankings.map((r) => {
      const medal = r.rank <= 3 ? medals[r.rank - 1] : `${r.rank}.`;
      const time =
        r.avgResponseTimeMs > 0 ? formatDuration(r.avgResponseTimeMs) : "N/A";
      return `${medal} *${r.user.login}* — ${time} · ${r.reviewCount}건 리뷰`;
    });

    await sendDeferredResponse(responseUrl, {
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
  } catch (error) {
    console.error("[/pr-leaderboard] error:", error);
    await sendDeferredResponse(responseUrl, {
      response_type: "ephemeral",
      text: "리더보드 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

async function handlePrStale(installationId: string) {
  // Open PR을 두 그룹으로 분리: 리뷰 대기 vs 리뷰 완료 & 미머지
  const [waitingForReview, reviewedButOpen] = await Promise.all([
    // 리뷰 대기: 리뷰가 아직 없는 open PR
    prisma.pullRequest.findMany({
      where: {
        repository: { installationId },
        state: "open",
        draft: false,
        firstReviewAt: null,
      },
      include: {
        author: { select: { login: true } },
        repository: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    // 리뷰 완료 & 미머지: 리뷰는 있지만 아직 open인 PR
    prisma.pullRequest.findMany({
      where: {
        repository: { installationId },
        state: "open",
        draft: false,
        firstReviewAt: { not: null },
      },
      include: {
        author: { select: { login: true } },
        repository: { select: { fullName: true } },
        reviews: {
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: { state: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
  ]);

  if (waitingForReview.length === 0 && reviewedButOpen.length === 0) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "🎉 열려있는 PR이 없습니다!",
    });
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `👀 열린 PR 현황`,
      },
    },
  ];

  if (waitingForReview.length > 0) {
    const lines = waitingForReview.map((pr) => {
      const elapsed = formatDuration(Date.now() - pr.createdAt.getTime());
      return `• <https://github.com/${pr.repository.fullName}/pull/${pr.number}|#${pr.number} ${pr.title}> by ${pr.author.login} (${elapsed}, 리뷰 대기)`;
    });
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📋 리뷰 대기 (${waitingForReview.length}개)*\n${lines.join("\n")}`,
        },
      },
    );
  }

  if (reviewedButOpen.length > 0) {
    const reviewStateLabels: Record<string, string> = {
      APPROVED: "승인됨",
      CHANGES_REQUESTED: "변경 요청",
      COMMENTED: "코멘트",
      DISMISSED: "기각됨",
    };

    const lines = reviewedButOpen.map((pr) => {
      const elapsed = formatDuration(Date.now() - pr.createdAt.getTime());
      const latestState = pr.reviews[0]?.state ?? "COMMENTED";
      const stateLabel = reviewStateLabels[latestState] ?? "리뷰됨";
      return `• <https://github.com/${pr.repository.fullName}/pull/${pr.number}|#${pr.number} ${pr.title}> by ${pr.author.login} (${elapsed}, ${stateLabel})`;
    });
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*✅ 리뷰 완료 & 미머지 (${reviewedButOpen.length}개)*\n${lines.join("\n")}`,
        },
      },
    );
  }

  return NextResponse.json({
    response_type: "in_channel",
    blocks,
  });
}
