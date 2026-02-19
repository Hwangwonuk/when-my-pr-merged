import { getInstallationOctokit } from "@/lib/github/app";
import { prisma } from "@/lib/prisma";
import { HISTORY_SYNC_DAYS } from "@/lib/utils/constants";
import { subDays } from "date-fns";

async function ensureUser(ghUser: { id: number; login: string; avatar_url?: string; name?: string | null }) {
  return prisma.user.upsert({
    where: { githubId: ghUser.id },
    update: { login: ghUser.login, avatarUrl: ghUser.avatar_url ?? null },
    create: {
      githubId: ghUser.id,
      login: ghUser.login,
      avatarUrl: ghUser.avatar_url ?? null,
      name: ghUser.name ?? null,
    },
  });
}

export async function syncHistoricalData(
  installationGithubId: number,
  installationId: string
) {
  const octokit = await getInstallationOctokit(installationGithubId);
  const since = subDays(new Date(), HISTORY_SYNC_DAYS).toISOString();

  // Get all repos for this installation
  const repos = await prisma.repository.findMany({
    where: { installationId },
  });

  for (const repo of repos) {
    await syncRepoHistory(octokit, repo.id, repo.fullName, since);
  }
}

async function syncRepoHistory(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  repoId: string,
  fullName: string,
  since: string
) {
  const [owner, repoName] = fullName.split("/");

  // Paginate through all PRs
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo: repoName,
      state: "all",
      sort: "created",
      direction: "desc",
      per_page: perPage,
      page,
    });

    if (pulls.length === 0) break;

    // Stop if we've gone past the since date
    const lastPr = pulls[pulls.length - 1];
    if (new Date(lastPr.created_at) < new Date(since)) {
      // Process only PRs within range, then stop
      const inRange = pulls.filter(
        (pr) => new Date(pr.created_at) >= new Date(since)
      );
      await processPulls(octokit, repoId, owner, repoName, inRange);
      break;
    }

    await processPulls(octokit, repoId, owner, repoName, pulls);
    page++;

    // Safety: stop after 10 pages (1000 PRs) to avoid timeout
    if (page > 10) break;
  }
}

async function processPulls(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  repoId: string,
  owner: string,
  repoName: string,
  pulls: Awaited<ReturnType<typeof octokit.rest.pulls.list>>["data"]
) {
  for (const pr of pulls) {
    // Skip if already exists
    const existing = await prisma.pullRequest.findUnique({
      where: { githubId: pr.id },
    });
    if (existing) continue;

    const author = await ensureUser(pr.user!);

    const state = pr.merged_at ? "merged" : pr.state === "closed" ? "closed" : "open";
    const createdAt = new Date(pr.created_at);
    const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
    const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;

    const timeToMergeMs = mergedAt
      ? BigInt(mergedAt.getTime() - createdAt.getTime())
      : null;

    const pullRequest = await prisma.pullRequest.create({
      data: {
        githubId: pr.id,
        number: pr.number,
        title: pr.title,
        state,
        draft: pr.draft ?? false,
        additions: (pr as Record<string, unknown>).additions as number ?? 0,
        deletions: (pr as Record<string, unknown>).deletions as number ?? 0,
        changedFiles: (pr as Record<string, unknown>).changed_files as number ?? 0,
        authorId: author.id,
        repositoryId: repoId,
        createdAt,
        mergedAt,
        closedAt,
        timeToMergeMs,
      },
    });

    // Fetch reviews for this PR
    try {
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner,
        repo: repoName,
        pull_number: pr.number,
        per_page: 100,
      });

      let firstReviewAt: Date | null = null;
      let firstApprovalAt: Date | null = null;

      for (const review of reviews) {
        if (!review.user || !review.submitted_at) continue;

        const reviewer = await ensureUser(review.user);
        const submittedAt = new Date(review.submitted_at);
        const reviewState = review.state?.toUpperCase() ?? "COMMENTED";

        if (!firstReviewAt || submittedAt < firstReviewAt) {
          firstReviewAt = submittedAt;
        }
        if (reviewState === "APPROVED" && (!firstApprovalAt || submittedAt < firstApprovalAt)) {
          firstApprovalAt = submittedAt;
        }

        await prisma.review.upsert({
          where: { githubId: review.id },
          update: { state: reviewState, submittedAt },
          create: {
            githubId: review.id,
            pullRequestId: pullRequest.id,
            reviewerId: reviewer.id,
            state: reviewState,
            submittedAt,
          },
        });
      }

      // Update PR with first review/approval timestamps
      if (firstReviewAt) {
        const timeToFirstReviewMs = BigInt(
          firstReviewAt.getTime() - createdAt.getTime()
        );
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: {
            firstReviewAt,
            firstApprovalAt,
            timeToFirstReviewMs,
            commentCount: reviews.length,
          },
        });
      }
    } catch {
      // Reviews fetch might fail for some PRs, continue
    }
  }
}
