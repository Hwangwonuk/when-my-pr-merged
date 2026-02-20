import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { FeatureLines } from "@/components/landing/feature-lines";
import { SlackMock } from "@/components/landing/slack-mock";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const githubAuthUrl = `/api/auth/github`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 0. Nav */}
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
        {/* 1. Opening Statement */}
        <section className="min-h-[90vh] flex items-end pb-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <ScrollReveal delay={0}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.95]">
                PR 올리고
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.95]">
                기다리는 시간,
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.95] text-gray-400">
                측정하고 있나요?
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={450}>
              <div className="mt-12">
                <div className="w-12 h-px bg-gray-700 mb-4 origin-left animate-[line-grow_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]" />
                <p className="font-mono text-sm text-gray-500">
                  GitHub PR 리뷰 속도를 추적하고, 팀의 코드 리뷰 병목을 찾아주는 대시보드
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 2. The Problem */}
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
                  PR을 올리고 나면 슬랙 알림만 기다립니다.
                  리뷰어가 바쁜 건지, 놓친 건지 알 수 없어요.
                  결국 DM을 보내거나, 그냥 기다립니다.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="text-lg text-gray-500 leading-relaxed">
                  &ldquo;첫 리뷰까지 평균 몇 시간 걸리는지&rdquo; 아는 팀은 거의 없습니다.
                  측정하지 않으면 개선할 수 없고, 개선하지 않으면 같은 패턴이 반복됩니다.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* 3. What It Does (Feature Lines) */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <FeatureLines />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-base text-gray-500 max-w-lg mt-12">
              GitHub App을 설치하면 PR 이벤트를 자동으로 수집합니다.
              리뷰어별 응답 속도부터 시간대별 머지 패턴까지,
              팀의 코드 리뷰 흐름을 숫자로 보여줍니다.
            </p>
          </ScrollReveal>
        </section>

        {/* 4. How It Works */}
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
                desc: "조직이나 개인 계정에 앱을 설치합니다. 권한은 PR 읽기만 요청합니다.",
              },
              {
                num: "02",
                title: "자동 데이터 수집",
                desc: "PR 생성, 리뷰 요청, 리뷰 제출, 머지까지 모든 이벤트를 웹훅으로 받습니다.",
              },
              {
                num: "03",
                title: "대시보드 & 알림",
                desc: "실시간 통계 대시보드를 확인하고, Slack으로 방치 PR 알림과 주간 리포트를 받습니다.",
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

        {/* 5. Proof Numbers */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto space-y-20 md:space-y-32">
          <ScrollReveal>
            <div>
              <p className="text-5xl md:text-7xl font-bold">
                <AnimatedCounter value="2.5시간" />
              </p>
              <p className="text-base text-gray-500 mt-2">
                평균 첫 리뷰까지 걸리는 시간
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="md:text-right">
              <p className="text-5xl md:text-7xl font-bold">
                <AnimatedCounter value="47분" />
              </p>
              <p className="text-base text-gray-500 mt-2">
                승인 후 머지까지 평균 소요 시간
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="md:pl-24">
              <p className="text-5xl md:text-7xl font-bold">
                <AnimatedCounter value="1.8회" />
              </p>
              <p className="text-base text-gray-500 mt-2">
                머지 전 평균 수정 횟수
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* 6. Slack Integration */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <ScrollReveal direction="left">
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">
                  Slack
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  알림이 와야<br />
                  움직이니까
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  방치된 PR 리마인더, 빠른 리뷰 칭찬, Hot Streak 알림까지.
                  팀 채널에 자동으로 보내드립니다.
                  매일 아침 다이제스트와 주간 리포트도 함께.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <SlackMock />
            </ScrollReveal>
          </div>
        </section>

        {/* 7. Closing CTA */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                PR 리뷰 속도,<br />
                측정하는 것부터 시작하세요
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

      {/* 8. Footer */}
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
