import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { FeatureLines } from "@/components/landing/feature-lines";
import { SlackMock } from "@/components/landing/slack-mock";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const githubAuthUrl = `/api/auth/github`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-14">
          <span className="text-sm font-semibold tracking-tight">
            내 PR 언제 머지돼?
          </span>
          <a
            href={githubAuthUrl}
            className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            GitHub로 시작하기 →
          </a>
        </div>
      </nav>

      <main>
        {/* S1. 질문 — 인식 */}
        <section className="min-h-[90vh] flex items-end pb-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <ScrollReveal delay={0}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.95]">
                PR 올리고
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.95] text-gray-400">
                얼마나 기다리나요?
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={350}>
              <div className="mt-12">
                <div className="w-12 h-px bg-gray-700 mb-4 origin-left animate-[line-grow_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]" />
                <p className="font-mono text-sm text-gray-500">
                  코드 리뷰 사이의 보이지 않는 시간을 측정합니다
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* S2. 불편한 사실 — 자각 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <ScrollReveal direction="left">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest md:sticky md:top-32">
                The Problem
              </p>
            </ScrollReveal>
            <div>
              <ScrollReveal>
                <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed mb-8">
                  코드 작성 시간은 체감합니다.<br />
                  배포 시간은 CI가 알려줍니다.<br />
                  <br />
                  그런데 리뷰를 기다리는 시간은?<br />
                  아무도 측정하지 않습니다.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="text-lg text-gray-500 leading-relaxed">
                  첫 리뷰까지 평균 몇 시간인지<br />
                  아는 팀은 거의 없습니다.<br />
                  <br />
                  측정하지 않으면 개선할 수 없고,<br />
                  개선하지 않으면 같은 패턴이 반복됩니다.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* S3. 달라지는 것 — 가능성 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-16">
              What Changes
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureLines />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="text-base text-gray-500 max-w-lg mt-12">
              GitHub App을 설치하면<br />
              PR 이벤트를 자동으로 수집합니다.<br />
              별도 설정 없이, 설치만 하면 바로 보입니다.
            </p>
          </ScrollReveal>
        </section>

        {/* S4. 기능 소개 — 구체화 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-16">
              팀의 PR 흐름을<br />
              한눈에 볼 수 있습니다
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {[
              {
                icon: "📊",
                title: "실시간 대시보드",
                desc: "총 PR 수, 평균 머지 시간, 첫 리뷰 시간,\n머지율을 한 화면에서 확인할 수 있습니다.\n이전 기간 대비 추세도 자동으로 계산됩니다.",
              },
              {
                icon: "👥",
                title: "리뷰어 랭킹",
                desc: "누가 빠르게, 얼마나 자주 리뷰하는지\n응답 시간·리뷰 수·승인율로 순위를 매깁니다.\n팀 내 리뷰 문화를 데이터로 확인할 수 있습니다.",
              },
              {
                icon: "🔮",
                title: "머지 예측",
                desc: "오픈된 PR이 언제쯤 머지될지\n과거 패턴을 기반으로 예측합니다.\n신뢰도(높음/보통/낮음)도 함께 표시됩니다.",
              },
              {
                icon: "🔍",
                title: "병목 분석",
                desc: "PR 오픈 → 첫 리뷰 → 승인 → 머지,\n각 단계별 소요 시간을 분석합니다.\n어디서 시간이 걸리는지 바로 파악할 수 있습니다.",
              },
              {
                icon: "📅",
                title: "시간대·요일 패턴",
                desc: "몇 시에 올린 PR이 가장 빨리 머지되는지,\n어떤 요일이 리뷰에 유리한지 알 수 있습니다.\n팀의 리뷰 리듬을 데이터로 파악할 수 있습니다.",
              },
              {
                icon: "📏",
                title: "PR 크기별 분석",
                desc: "S, M, L, XL 크기별 평균 머지 시간을\n비교해서 보여줍니다.\n작은 PR이 빠르다는 걸 데이터로 증명합니다.",
              },
              {
                icon: "🏆",
                title: "리더보드 & 배지",
                desc: "리뷰어·PR 작성자 리더보드와\n매주 자동으로 수여되는 배지 시스템입니다.\n팀 내 건전한 경쟁을 유도합니다.",
              },
              {
                icon: "⚡",
                title: "컨플릭트 패턴",
                desc: "컨플릭트가 자주 발생하는 요일과\nPR 크기를 분석합니다.\n문제가 되기 전에 패턴을 인식할 수 있습니다.",
              },
              {
                icon: "📈",
                title: "월간 리포트",
                desc: "매월 PR 수, 머지 시간, 첫 리뷰 시간의\n변화를 자동으로 추적합니다.\n전월 대비 개선 여부를 바로 확인할 수 있습니다.",
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i % 3 * 100}>
                <div className="group">
                  <span className="text-2xl mb-3 block">{feature.icon}</span>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                    {feature.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* S5. 대시보드 미리보기 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <ScrollReveal direction="left">
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">
                  Dashboard
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  설치하면<br />
                  이런 화면을 볼 수 있습니다
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  PR 현황, 리뷰어 순위, 시간대별 패턴까지<br />
                  모든 데이터가 하나의 대시보드에 정리됩니다.<br />
                  <br />
                  탭을 눌러서 미리 확인해 보세요.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <DashboardPreview />
            </ScrollReveal>
          </div>
        </section>

        {/* S6. 작동 방식 — 신뢰 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-16">
              How It Works
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                num: "01",
                title: "GitHub App 설치",
                desc: "조직이나 개인 계정에 설치하세요.\nPR 읽기 권한만 필요합니다.",
              },
              {
                num: "02",
                title: "자동 수집",
                desc: "PR 생성부터 머지까지,\n모든 이벤트를 웹훅으로 받아 기록합니다.",
              },
              {
                num: "03",
                title: "대시보드 & Slack",
                desc: "통계는 대시보드에서, 알림은 Slack으로.\n별도 설정이 거의 필요 없습니다.",
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 150}>
                <div className="border-l border-gray-800 pl-8 py-6">
                  <p className="font-mono text-xs text-gray-500 mb-3">
                    {step.num}
                  </p>
                  <p className="text-xl font-semibold mb-2">{step.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* S7. Slack — 신뢰 보강 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <ScrollReveal direction="left">
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">
                  Slack
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  대시보드를 매번<br />
                  확인할 수 없으니까
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  방치된 PR 리마인더, 빠른 리뷰 칭찬,<br />
                  Hot Streak 알림이 팀 채널로 전송됩니다.<br />
                  <br />
                  매일 다이제스트와 주간 리포트도<br />
                  자동으로 받아볼 수 있습니다.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <SlackMock />
            </ScrollReveal>
          </div>
        </section>

        {/* S8. 시작 — 행동 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                측정하는 것부터<br />
                시작해 보세요
              </h2>
              <a
                href={githubAuthUrl}
                className="inline-block text-indigo-400 hover:text-indigo-300 text-lg transition-colors duration-300 border-b border-indigo-400/30 hover:border-indigo-300 pb-1"
                style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
              >
                GitHub로 시작하기 →
              </a>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-8">
          <p className="text-sm text-gray-600">
            &copy; 2026 내 PR 언제 머지돼?
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
