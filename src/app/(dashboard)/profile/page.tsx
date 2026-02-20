import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { UserCircle } from "lucide-react";
import { formatDuration, formatPercentage, formatNumber } from "@/lib/utils/format";
import { subDays } from "date-fns";

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    include: {
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) redirect("/login");

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // 내가 작성한 PR 통계
  const authoredPRs = await prisma.pullRequest.findMany({
    where: {
      authorId: user.id,
      createdAt: { gte: thirtyDaysAgo, lte: now },
    },
    select: {
      state: true,
      timeToMergeMs: true,
      timeToFirstReviewMs: true,
      revisionCount: true,
      additions: true,
      deletions: true,
    },
  });

  const mergedPRs = authoredPRs.filter((pr) => pr.state === "merged");
  const mergeTimes = mergedPRs
    .filter((pr) => pr.timeToMergeMs !== null)
    .map((pr) => Number(pr.timeToMergeMs));
  const avgMergeTimeMs =
    mergeTimes.length > 0
      ? mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length
      : 0;
  const avgRevisionCount =
    mergedPRs.length > 0
      ? mergedPRs.reduce((sum, pr) => sum + pr.revisionCount, 0) /
        mergedPRs.length
      : 0;

  // 내가 한 리뷰 통계
  const reviews = await prisma.review.findMany({
    where: {
      reviewerId: user.id,
      submittedAt: { gte: thirtyDaysAgo, lte: now },
    },
    select: {
      state: true,
      responseTimeMs: true,
    },
  });

  const responseTimes = reviews
    .filter((r) => r.responseTimeMs !== null)
    .map((r) => Number(r.responseTimeMs));
  const avgResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
  const approvals = reviews.filter((r) => r.state === "APPROVED").length;
  const approvalRate =
    reviews.length > 0 ? (approvals / reviews.length) * 100 : 0;

  // 전체 리뷰어 중 내 순위
  const allReviewers = await prisma.review.groupBy({
    by: ["reviewerId"],
    where: {
      submittedAt: { gte: thirtyDaysAgo, lte: now },
      responseTimeMs: { not: null },
    },
    _avg: { responseTimeMs: true },
  });

  const sortedReviewers = allReviewers
    .filter((r) => r._avg.responseTimeMs !== null)
    .sort((a, b) => Number(a._avg.responseTimeMs) - Number(b._avg.responseTimeMs));
  const myRank = sortedReviewers.findIndex((r) => r.reviewerId === user.id) + 1;
  const percentile =
    sortedReviewers.length > 1 && myRank > 0
      ? Math.round((1 - (myRank - 1) / (sortedReviewers.length - 1)) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-5 mb-8">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.login}
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? user.login}</h1>
          <p className="text-gray-400">@{user.login}</p>
        </div>
      </div>

      {authoredPRs.length === 0 && reviews.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="w-12 h-12" />}
          title="아직 활동 데이터가 없습니다"
          description="최근 30일간의 PR 및 리뷰 활동이 표시됩니다."
        />
      ) : (
        <div className="space-y-6">
          {/* PR 작성 통계 */}
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4">내가 올린 PR (최근 30일)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">총 PR</p>
                <p className="text-2xl font-bold text-white">
                  {authoredPRs.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">머지된 PR</p>
                <p className="text-2xl font-bold text-green-400">
                  {mergedPRs.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">평균 머지 시간</p>
                <p className="text-2xl font-bold text-white">
                  {avgMergeTimeMs > 0 ? formatDuration(avgMergeTimeMs) : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">평균 수정 횟수</p>
                <p className="text-2xl font-bold text-white">
                  {avgRevisionCount.toFixed(1)}회
                </p>
              </div>
            </div>
          </div>

          {/* 리뷰 통계 */}
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4">내 리뷰 활동 (최근 30일)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">총 리뷰</p>
                <p className="text-2xl font-bold text-white">{reviews.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">평균 응답 시간</p>
                <p className="text-2xl font-bold text-white">
                  {avgResponseTimeMs > 0
                    ? formatDuration(avgResponseTimeMs)
                    : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">승인율</p>
                <p className="text-2xl font-bold text-white">
                  {reviews.length > 0 ? formatPercentage(approvalRate, 0) : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">리뷰어 순위</p>
                <p className="text-2xl font-bold text-indigo-400">
                  {myRank > 0 ? `상위 ${100 - percentile}%` : "--"}
                </p>
              </div>
            </div>
          </div>

          {/* 배지 */}
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4">획득 배지</h2>
            {user.badges.length === 0 ? (
              <p className="text-sm text-gray-500">
                아직 획득한 배지가 없습니다. 꾸준한 리뷰 활동으로 배지를 획득해보세요!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.badges.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-700/20 px-4 py-3"
                  >
                    <span className="text-2xl">{ub.badge.iconUrl}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {ub.badge.name}
                        </p>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            ub.badge.tier === "gold"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : ub.badge.tier === "silver"
                                ? "bg-gray-600/30 text-gray-300"
                                : ub.badge.tier === "diamond"
                                  ? "bg-cyan-900/30 text-cyan-400"
                                  : "bg-amber-900/30 text-amber-400"
                          }`}
                        >
                          {ub.badge.tier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {ub.badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
