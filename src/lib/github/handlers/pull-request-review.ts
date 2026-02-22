import { prisma } from "@/lib/prisma";
import { sendFastReviewPraise } from "@/lib/slack/notifications";
import { FAST_REVIEW_THRESHOLD_MS } from "@/lib/utils/constants";

interface PullRequestReviewPayload {
  action: string;
  review: {
    id: number;
    state: string; // "approved", "changes_requested", "commented", "dismissed"
    submitted_at: string;
    user: {
      id: number;
      login: string;
      avatar_url: string;
      name?: string;
    };
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    created_at: string;
    base: {
      repo: {
        id: number;
      };
    };
  };
  repository: {
    id: number;
  };
  installation?: { id: number };
}

export async function handlePullRequestReviewEvent(payload: PullRequestReviewPayload) {
  const { action, review, pull_request: pr } = payload;

  if (action !== "submitted") return;

  const existingPr = await prisma.pullRequest.findUnique({
    where: { githubId: pr.id },
  });
  if (!existingPr) return;

  // Ensure reviewer user exists
  const reviewer = await prisma.user.upsert({
    where: { githubId: review.user.id },
    update: {
      login: review.user.login,
      avatarUrl: review.user.avatar_url,
    },
    create: {
      githubId: review.user.id,
      login: review.user.login,
      avatarUrl: review.user.avatar_url,
      name: review.user.name,
    },
  });

  const submittedAt = new Date(review.submitted_at);
  const state = review.state.toUpperCase();

  // Find matching review request to compute response time
  const reviewRequest = await prisma.reviewRequest.findFirst({
    where: {
      pullRequestId: existingPr.id,
      reviewerId: reviewer.id,
      fulfilledAt: null,
    },
    orderBy: { requestedAt: "desc" },
  });

  let responseTimeMs: bigint;
  if (reviewRequest) {
    responseTimeMs = BigInt(submittedAt.getTime() - reviewRequest.requestedAt.getTime());
  } else {
    // Fallback: use PR creation time as the request time
    responseTimeMs = BigInt(submittedAt.getTime() - existingPr.createdAt.getTime());
  }

  // Create review record
  await prisma.review.upsert({
    where: { githubId: review.id },
    update: {
      state,
      submittedAt,
      responseTimeMs,
    },
    create: {
      githubId: review.id,
      pullRequestId: existingPr.id,
      reviewerId: reviewer.id,
      state,
      submittedAt,
      responseTimeMs,
    },
  });

  // Fulfill review request or create one retroactively
  if (reviewRequest) {
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { fulfilledAt: submittedAt },
    });
  } else {
    await prisma.reviewRequest.create({
      data: {
        pullRequestId: existingPr.id,
        reviewerId: reviewer.id,
        requestedAt: existingPr.createdAt,
        fulfilledAt: submittedAt,
      },
    });
  }

  // Update PR metrics
  const isFirstReview = !existingPr.firstReviewAt;
  const isFirstApproval = !existingPr.firstApprovalAt && state === "APPROVED";

  const updateData: Record<string, unknown> = {
    commentCount: { increment: 1 },
  };

  if (isFirstReview) {
    updateData.firstReviewAt = submittedAt;
    updateData.timeToFirstReviewMs = BigInt(
      submittedAt.getTime() - existingPr.createdAt.getTime()
    );
  }

  if (isFirstApproval) {
    updateData.firstApprovalAt = submittedAt;
  }

  if (state === "CHANGES_REQUESTED") {
    updateData.reviewCycleCount = { increment: 1 };
  }

  await prisma.pullRequest.update({
    where: { id: existingPr.id },
    data: updateData,
  });

  // Send fast review praise if applicable
  if (responseTimeMs <= BigInt(FAST_REVIEW_THRESHOLD_MS)) {
    const repo = await prisma.repository.findUnique({
      where: { githubId: payload.repository.id },
      include: { installation: { include: { slackIntegration: true } } },
    });

    if (repo?.installation.slackIntegration?.autoPraiseEnabled) {
      await sendFastReviewPraise(
        repo.installation.slackIntegration,
        reviewer.login,
        Number(responseTimeMs)
      );
    }
  }
}
