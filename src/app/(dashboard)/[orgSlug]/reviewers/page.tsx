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
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">리뷰어 랭킹</h1>
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
        <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider">리뷰어 랭킹</h1>
        <div className="flex gap-0.5">
          {[
            { value: "7d", label: "7일" },
            { value: "30d", label: "30일" },
            { value: "90d", label: "90일" },
          ].map((p) => (
            <a
              key={p.value}
              href={`/${orgSlug}/reviewers?period=${p.value}`}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors duration-200 ${
                period === p.value
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
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
        <div className="space-y-8">
          <ReviewerSpeedChart data={rankings} />
          <ReviewerRankingTable rankings={rankings} />
        </div>
      )}
    </div>
  );
}
