import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardRootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.member.findMany({
    where: { userId: user.userId },
    include: {
      installation: {
        include: {
          _count: { select: { repositories: true } },
        },
      },
    },
  });

  // 소속 org가 하나면 자동 리다이렉트
  if (memberships.length === 1) {
    redirect(`/${memberships[0].installation.accountLogin}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">조직 선택</h1>
      <p className="text-gray-400 mb-8">
        대시보드를 확인할 조직을 선택하세요.
      </p>

      {memberships.length === 0 ? (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-8 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold mb-2">
            GitHub App을 설치해주세요
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            PR 데이터를 수집하려면 GitHub 조직에 &quot;내 PR 언제 머지돼?&quot;
            앱을 설치해야 합니다.
          </p>
          <a
            href={`https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            GitHub App 설치하기
          </a>
          <p className="text-xs text-gray-500 mt-4">
            설치 후 이 페이지를 새로고침하면 조직이 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberships.map((m) => (
            <Link
              key={m.installation.id}
              href={`/${m.installation.accountLogin}`}
              className="flex items-center gap-4 rounded-xl bg-gray-800/50 border border-gray-700/50 p-5 hover:bg-gray-800 hover:border-gray-600 transition-colors group"
            >
              {m.installation.accountAvatarUrl ? (
                <img
                  src={m.installation.accountAvatarUrl}
                  alt={m.installation.accountLogin}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                  {m.installation.accountLogin[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {m.installation.accountLogin}
                </p>
                <p className="text-sm text-gray-500">
                  {m.installation.accountType === "Organization"
                    ? "조직"
                    : "개인"}{" "}
                  · 저장소 {m.installation._count.repositories}개
                </p>
              </div>
              <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
                →
              </span>
            </Link>
          ))}

          <div className="pt-4 text-center">
            <a
              href={`https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + 다른 조직에도 설치하기
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
