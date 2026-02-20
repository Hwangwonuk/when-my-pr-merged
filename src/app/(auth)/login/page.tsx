import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { FeatureLines } from "@/components/landing/feature-lines";
import { SlackMock } from "@/components/landing/slack-mock";

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
                얼마나 기다려요?
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
                  코드 작성 시간은 체감합니다.
                  배포 시간은 CI가 알려줍니다.
                  그런데 리뷰를 기다리는 시간은요?
                  아무도 측정하지 않습니다.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="text-lg text-gray-500 leading-relaxed">
                  첫 리뷰까지 평균 몇 시간인지 아는 팀은 거의 없습니다.
                  측정하지 않으면 개선할 수 없고,
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
              GitHub App을 설치하면 PR 이벤트를 자동으로 수집합니다.
              기능을 설정하는 게 아니라, 설치하면 바로 보이기 시작합니다.
            </p>
          </ScrollReveal>
        </section>

        {/* S4. 작동 방식 — 신뢰 */}
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
                desc: "조직이나 개인 계정에 설치합니다. PR 읽기 권한만 요청합니다.",
              },
              {
                num: "02",
                title: "자동 수집",
                desc: "PR 생성부터 머지까지, 모든 이벤트를 웹훅으로 받아 기록합니다.",
              },
              {
                num: "03",
                title: "대시보드 & Slack",
                desc: "통계는 대시보드에서, 알림은 Slack으로. 설정할 게 거의 없습니다.",
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 150}>
                <div className="border-l border-gray-800 pl-8 py-6">
                  <p className="font-mono text-xs text-gray-500 mb-3">
                    {step.num}
                  </p>
                  <p className="text-xl font-semibold mb-2">{step.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Slack — 신뢰 보강 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <ScrollReveal direction="left">
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">
                  Slack
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  대시보드를 매번<br />
                  열어볼 순 없으니까
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  방치된 PR 리마인더, 빠른 리뷰 칭찬,
                  Hot Streak 알림이 팀 채널로 갑니다.
                  매일 다이제스트와 주간 리포트도 자동으로.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <SlackMock />
            </ScrollReveal>
          </div>
        </section>

        {/* S5. 시작 — 행동 */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                측정하는 것부터<br />
                시작하세요
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
