import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { ChannelSelector } from "@/components/dashboard/channel-selector";
import { NotificationToggle } from "@/components/dashboard/notification-toggle";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = await params;

  const installation = await prisma.installation.findFirst({
    where: { accountLogin: orgSlug },
    include: {
      slackIntegration: true,
      repositories: {
        select: { id: true, fullName: true, name: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { repositories: true, members: true } },
    },
  });

  if (!installation) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">설정</h1>
        <EmptyState
          icon="⚙️"
          title="GitHub App이 설치되지 않았습니다"
          description="설정을 변경하려면 먼저 GitHub App을 설치해주세요."
        />
      </div>
    );
  }

  const slack = installation.slackIntegration;
  const hasSlack = !!slack;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">설정</h1>

      <div className="space-y-6">
        {/* Installation Info */}
        <section className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">GitHub App 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">조직</p>
              <div className="flex items-center gap-2">
                {installation.accountAvatarUrl && (
                  <img
                    src={installation.accountAvatarUrl}
                    alt={orgSlug}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <p className="text-white font-medium">{orgSlug}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">추적 중인 저장소</p>
              <p className="text-white font-medium">
                {installation._count.repositories}개
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">멤버</p>
              <p className="text-white font-medium">
                {installation._count.members}명
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">데이터 동기화</p>
              <SyncStatusBadge
                status={installation.syncStatus}
                syncedAt={installation.syncedAt}
              />
            </div>
          </div>

          {installation.repositories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">저장소 목록</p>
              <div className="flex flex-wrap gap-2">
                {installation.repositories.map((repo) => (
                  <span
                    key={repo.id}
                    className="text-xs px-2 py-1 rounded bg-gray-700/50 text-gray-300"
                  >
                    {repo.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Slack Integration */}
        <section className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Slack 연동</h2>

          {hasSlack ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-sm text-green-400 font-medium">연결됨</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">워크스페이스</p>
                  <p className="text-white">{slack.teamName}</p>
                </div>
                <ChannelSelector
                  installationId={installation.id}
                  currentChannelId={slack.channelId}
                  currentChannelName={slack.channelName}
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Slack을 연결하면 방치 PR 알림, 리뷰 칭찬, 주간 리포트 등을 받을 수 있습니다.
              </p>
              <a
                href={`/api/slack/install?installationId=${installation.id}`}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Slack 워크스페이스 연결
              </a>
            </div>
          )}
        </section>

        {/* Notification Settings */}
        <section className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">알림 설정</h2>

          {!hasSlack ? (
            <p className="text-sm text-gray-500">
              알림을 설정하려면 먼저 Slack을 연동해주세요.
            </p>
          ) : (
            <div className="space-y-4">
              <NotificationToggle
                installationId={installation.id}
                field="stalePrAlertEnabled"
                label="방치 PR 알림"
                description={`리뷰 없이 ${slack.stalePrThresholdHours}시간이 지나면 알림`}
                enabled={slack.stalePrAlertEnabled}
              />
              <NotificationToggle
                installationId={installation.id}
                field="autoPraiseEnabled"
                label="빠른 리뷰 자동 칭찬"
                description="30분 내 리뷰 완료 시 감사 메시지 전송"
                enabled={slack.autoPraiseEnabled}
              />
              <NotificationToggle
                installationId={installation.id}
                field="hotStreakAlertEnabled"
                label="Hot Streak 알림"
                description="연속 3개 PR이 1시간 내 머지 시 알림"
                enabled={slack.hotStreakAlertEnabled}
              />
              <NotificationToggle
                installationId={installation.id}
                field="dailyDigestEnabled"
                label="일간 다이제스트"
                description="매일 전날의 PR 활동 요약 Slack 전송"
                enabled={slack.dailyDigestEnabled}
              />
              <NotificationToggle
                installationId={installation.id}
                field="weeklyReportEnabled"
                label="주간 리포트"
                description="매주 월요일 PR 통계 요약 Slack 전송"
                enabled={slack.weeklyReportEnabled}
              />
            </div>
          )}
        </section>

        {/* Setup Checklist */}
        <section className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">설정 체크리스트</h2>
          <div className="space-y-3">
            <ChecklistItem
              done={true}
              label="GitHub App 설치"
              description="PR 이벤트 수집이 활성화되었습니다"
            />
            <ChecklistItem
              done={installation._count.repositories > 0}
              label="저장소 추가"
              description="추적할 저장소가 등록되어 있습니다"
            />
            <ChecklistItem
              done={hasSlack}
              label="Slack 연동"
              description="알림과 리포트를 Slack으로 전송합니다"
            />
            <ChecklistItem
              done={hasSlack && !!slack?.channelId}
              label="알림 채널 설정"
              description="알림을 받을 Slack 채널을 설정합니다"
            />
          </div>
        </section>
      </div>
    </div>
  );
}


function SyncStatusBadge({
  status,
  syncedAt,
}: {
  status: string;
  syncedAt: Date | null;
}) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "대기 중", className: "bg-gray-700/30 text-gray-400" },
    syncing: { label: "동기화 중...", className: "bg-yellow-900/30 text-yellow-400" },
    completed: { label: "완료", className: "bg-green-900/30 text-green-400" },
    failed: { label: "실패", className: "bg-red-900/30 text-red-400" },
  };
  const { label, className } = config[status] ?? config.pending;

  return (
    <div>
      <span className={`text-xs px-2 py-1 rounded-full ${className}`}>
        {label}
      </span>
      {syncedAt && (
        <p className="text-xs text-gray-500 mt-1">
          {syncedAt.toLocaleDateString("ko-KR")}
        </p>
      )}
    </div>
  );
}

function ChecklistItem({
  done,
  label,
  description,
}: {
  done: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          done
            ? "bg-green-600 text-white"
            : "bg-gray-700 text-gray-500"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div>
        <p
          className={`text-sm font-medium ${
            done ? "text-white" : "text-gray-400"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
