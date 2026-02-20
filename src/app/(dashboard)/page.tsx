import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Link2 } from "lucide-react";

export default async function DashboardRootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let memberships = await prisma.member.findMany({
    where: { userId: user.userId },
    include: {
      installation: {
        include: {
          _count: { select: { repositories: true } },
        },
      },
    },
  });

  // member 레코드가 없지만 동일 login의 installation이 있으면 자동 생성
  if (memberships.length === 0) {
    const matchingInstallations = await prisma.installation.findMany({
      where: { accountLogin: user.login },
    });

    for (const inst of matchingInstallations) {
      await prisma.member.upsert({
        where: {
          userId_installationId: {
            userId: user.userId,
            installationId: inst.id,
          },
        },
        update: {},
        create: {
          userId: user.userId,
          installationId: inst.id,
          role: "admin",
        },
      });
    }

    if (matchingInstallations.length > 0) {
      memberships = await prisma.member.findMany({
        where: { userId: user.userId },
        include: {
          installation: {
            include: {
              _count: { select: { repositories: true } },
            },
          },
        },
      });
    }
  }

  // 소속 org가 하나면 자동 리다이렉트
  if (memberships.length === 1) {
    redirect(`/${memberships[0].installation.accountLogin}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">조직 선택</h1>
      <p className="text-xs text-gray-500 mb-8">
        대시보드를 확인할 조직을 선택하세요.
      </p>

      {memberships.length === 0 ? (
        <div className="border border-gray-800/50 rounded-lg p-8 text-center">
          <div className="mb-4 flex justify-center text-gray-600">
            <Link2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            GitHub App을 설치해 주세요
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            PR 데이터를 수집하려면 GitHub 조직에<br />
            &quot;내 PR 언제 머지돼?&quot; 앱을 설치해야 합니다.
          </p>
          <a
            href={`https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm rounded-md font-medium transition-colors duration-200"
          >
            GitHub App 설치하기
          </a>
          <p className="text-xs text-gray-600 mt-4">
            설치 후 이 페이지를 새로고침하면 조직이 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberships.map((m) => (
            <Link
              key={m.installation.id}
              href={`/${m.installation.accountLogin}`}
              className="flex items-center gap-4 px-4 py-3.5 -mx-4 rounded-md hover:bg-gray-800/40 hover:-translate-y-px transition-all duration-200 group"
            >
              {m.installation.accountAvatarUrl ? (
                <img
                  src={m.installation.accountAvatarUrl}
                  alt={m.installation.accountLogin}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm text-gray-400">
                  {m.installation.accountLogin[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white group-hover:text-indigo-400 transition-colors duration-200">
                  {m.installation.accountLogin}
                </p>
                <p className="text-xs text-gray-600">
                  {m.installation.accountType === "Organization"
                    ? "조직"
                    : "개인"}{" "}
                  · 저장소 {m.installation._count.repositories}개
                </p>
              </div>
              <span className="text-gray-700 group-hover:text-gray-400 transition-colors duration-200">
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
