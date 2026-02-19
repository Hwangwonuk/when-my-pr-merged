import { prisma } from "@/lib/prisma";
import { checkHotStreak } from "@/lib/stats/hot-streak";
import { getMergePrediction } from "@/lib/stats/predictions";
import { sendMergePrediction } from "@/lib/slack/notifications";
import { getInstallationOctokit } from "@/lib/github/app";
import { formatDuration } from "@/lib/utils/format";

interface PullRequestPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: string;
    draft: boolean;
    additions: number;
    deletions: number;
    changed_files: number;
    merged: boolean;
    mergeable: boolean | null;
    mergeable_state: string; // "clean" | "dirty" | "unstable" | "blocked" | "unknown"
    merged_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    user: {
      id: number;
      login: string;
      avatar_url: string;
      name?: string;
    };
    requested_reviewers: Array<{
      id: number;
      login: string;
      avatar_url: string;
    }>;
    base: {
      repo: {
        id: number;
        name: string;
        full_name: string;
      };
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  installation?: { id: number };
}

async function ensureUser(ghUser: { id: number; login: string; avatar_url: string; name?: string }) {
  return prisma.user.upsert({
    where: { githubId: ghUser.id },
    update: {
      login: ghUser.login,
      avatarUrl: ghUser.avatar_url,
      name: ghUser.name,
    },
    create: {
      githubId: ghUser.id,
      login: ghUser.login,
      avatarUrl: ghUser.avatar_url,
      name: ghUser.name,
    },
  });
}

export async function handlePullRequestEvent(payload: PullRequestPayload) {
  const { action, pull_request: pr } = payload;

  const repo = await prisma.repository.findUnique({
    where: { githubId: payload.repository.id },
  });
  if (!repo) return;

  const author = await ensureUser(pr.user);

  switch (action) {
    case "opened":
    case "reopened": {
      const state = pr.merged ? "merged" : pr.state;
      await prisma.pullRequest.upsert({
        where: { githubId: pr.id },
        update: {
          title: pr.title,
          state,
          draft: pr.draft,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
        },
        create: {
          githubId: pr.id,
          number: pr.number,
          title: pr.title,
          state,
          draft: pr.draft,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          authorId: author.id,
          repositoryId: repo.id,
          createdAt: new Date(pr.created_at),
        },
      });

      // PR 크기 가이드 자동 코멘트 (opened만, draft 아닌 경우)
      if (action === "opened" && !pr.draft && payload.installation?.id) {
        postSizeGuideComment(
          payload.installation.id,
          payload.repository.full_name,
          pr.number,
          pr.additions + pr.deletions
        ).catch(() => {/* 실패해도 무시 */});

        // Slack 머지 예측 알림 (fire-and-forget)
        sendPredictionToSlack(
          repo.installationId,
          pr.id,
          pr.title,
          pr.number
        ).catch(() => {/* 실패해도 무시 */});
      }
      break;
    }

    case "closed": {
      const existingPr = await prisma.pullRequest.findUnique({
        where: { githubId: pr.id },
      });
      if (!existingPr) return;

      const state = pr.merged ? "merged" : "closed";
      const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
      const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;

      const timeToMergeMs = mergedAt
        ? BigInt(mergedAt.getTime() - existingPr.createdAt.getTime())
        : null;

      await prisma.pullRequest.update({
        where: { githubId: pr.id },
        data: {
          state,
          mergedAt,
          closedAt,
          timeToMergeMs,
        },
      });

      // Check hot streak if merged
      if (pr.merged) {
        await checkHotStreak(author.id, repo.installationId);
      }
      break;
    }

    case "synchronize": {
      // New push to PR - increment revision count if review has started
      const existingPr = await prisma.pullRequest.findUnique({
        where: { githubId: pr.id },
      });
      if (!existingPr) break;

      const syncData: Record<string, unknown> = {};
      if (existingPr.firstReviewAt) {
        syncData.revisionCount = { increment: 1 };
      }

      // Conflict resolved after push?
      if (existingPr.hasConflict && pr.mergeable !== false) {
        syncData.conflictResolvedAt = new Date();
      }

      if (Object.keys(syncData).length > 0) {
        await prisma.pullRequest.update({
          where: { githubId: pr.id },
          data: syncData,
        });
      }
      break;
    }

    case "review_requested": {
      for (const reviewer of pr.requested_reviewers) {
        const reviewerUser = await ensureUser(reviewer);
        await prisma.reviewRequest.create({
          data: {
            pullRequestId: (
              await prisma.pullRequest.findUnique({ where: { githubId: pr.id } })
            )!.id,
            reviewerId: reviewerUser.id,
            requestedAt: new Date(),
          },
        });
      }
      break;
    }

    case "edited": {
      await prisma.pullRequest.updateMany({
        where: { githubId: pr.id },
        data: {
          title: pr.title,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
        },
      });
      break;
    }

    case "ready_for_review": {
      await prisma.pullRequest.updateMany({
        where: { githubId: pr.id },
        data: { draft: false },
      });
      break;
    }

    case "converted_to_draft": {
      await prisma.pullRequest.updateMany({
        where: { githubId: pr.id },
        data: { draft: true },
      });
      break;
    }
  }

  // Conflict detection (runs for all actions when mergeable info is available)
  if (pr.mergeable === false && pr.mergeable_state === "dirty") {
    const existingPr = await prisma.pullRequest.findUnique({
      where: { githubId: pr.id },
    });
    if (existingPr && !existingPr.hasConflict) {
      await prisma.pullRequest.update({
        where: { githubId: pr.id },
        data: {
          hasConflict: true,
          conflictDetectedAt: new Date(),
          conflictResolvedAt: null,
        },
      });
    }
  }
}

async function postSizeGuideComment(
  installationGithubId: number,
  repoFullName: string,
  prNumber: number,
  linesChanged: number
) {
  const [owner, repoName] = repoFullName.split("/");
  const octokit = await getInstallationOctokit(installationGithubId);

  let body: string;
  if (linesChanged <= 100) {
    body = `✅ **리뷰하기 좋은 크기입니다** (${linesChanged}줄)\n\n작은 PR은 빠르고 정확한 리뷰를 받기 쉽습니다. 좋은 습관이에요!`;
  } else if (linesChanged <= 300) {
    body = `🟡 **중간 크기의 PR입니다** (${linesChanged}줄)\n\n가능하다면 더 작게 나눠보는 것을 추천합니다. 작은 PR일수록 리뷰 속도가 빨라집니다.`;
  } else {
    body = `🔴 **큰 PR입니다** (${linesChanged}줄)\n\n이 크기의 PR은 리뷰에 시간이 오래 걸릴 수 있습니다. 기능 단위로 분할하는 것을 고려해주세요.`;
  }

  body += `\n\n---\n<sub>🤖 내 PR 언제 머지돼? — 자동 크기 가이드</sub>`;

  await octokit.rest.issues.createComment({
    owner,
    repo: repoName,
    issue_number: prNumber,
    body,
  });
}

async function sendPredictionToSlack(
  installationId: string,
  prGithubId: number,
  prTitle: string,
  prNumber: number
) {
  // Slack 연동이 있는지 확인
  const slack = await prisma.slackIntegration.findUnique({
    where: { installationId },
  });
  if (!slack?.channelId || !slack.botToken) return;

  // DB에서 PR 레코드 조회
  const dbPr = await prisma.pullRequest.findUnique({
    where: { githubId: prGithubId },
  });
  if (!dbPr) return;

  const prediction = await getMergePrediction({
    prId: dbPr.id,
    installationId,
  });
  if (!prediction) return;

  const remainingMs =
    new Date(prediction.predictedMergeAt).getTime() - Date.now();
  const predictedTime = formatDuration(Math.max(remainingMs, 0));

  await sendMergePrediction(
    { botToken: slack.botToken, channelId: slack.channelId },
    { title: prTitle, number: prNumber, predictedTime }
  );
}
