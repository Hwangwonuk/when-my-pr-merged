import { prisma } from "@/lib/prisma";
import { getReviewerRankings } from "@/lib/stats/reviewer-ranking";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { ReviewerRankingTable } from "@/components/dashboard/reviewer-ranking-table";
import { ReviewerSpeedChart } from "@/components/charts/reviewer-speed-chart";
import { subDays } from "date-fns";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function ReviewersPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { period = "30d" } = await searchParams;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">리뷰어 랭킹</h1>
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="GitHub App이 설치되지 않았습니다"
          description="리뷰어 데이터를 보려면 먼저 GitHub App을 설치해주세요."
        />
      </div>
    );
  }

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const now = new Date();
  const from = subDays(now, days);

  const rankings = await getReviewerRankings({
    installationId: installation.id,
    from: from.toISOString(),
    to: now.toISOString(),
    limit: 20,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">리뷰어 랭킹</h1>
        <div className="flex gap-1 rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
          {[
            { value: "7d", label: "7일" },
            { value: "30d", label: "30일" },
            { value: "90d", label: "90일" },
          ].map((p) => (
            <a
              key={p.value}
              href={`/${orgSlug}/reviewers?period=${p.value}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p.value
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {rankings.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="리뷰어 데이터가 없습니다"
          description="이 기간에 리뷰 활동이 없습니다. 기간을 변경하거나 PR 리뷰가 쌓이기를 기다려주세요."
        />
      ) : (
        <div className="space-y-6">
          <ReviewerSpeedChart data={rankings} />
          <ReviewerRankingTable rankings={rankings} />
        </div>
      )}
    </div>
  );
}
