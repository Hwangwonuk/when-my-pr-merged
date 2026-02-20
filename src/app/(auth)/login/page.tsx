import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Trophy,
  Search,
  GitPullRequest,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { AnimatedCounter } from "@/components/landing/animated-counter";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  iconBg: string;
}[] = [
  {
    icon: BarChart3,
    title: "핵심 통계",
    description:
      "리뷰어별 응답 속도, 시간대별 머지 패턴, PR 크기별 머지 시간을 한눈에 파악하세요.",
    accent: "border-t-indigo-500",
    iconBg: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: Bell,
    title: "스마트 알림",
    description:
      "방치된 PR 리마인더, 머지 예측, Hot Streak 알림을 Slack으로 받으세요.",
    accent: "border-t-amber-500",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Trophy,
    title: "리뷰왕 배지",
    description:
      "리뷰왕, 번개 리뷰어 등 배지 시스템으로 코드 리뷰를 재미있게!",
    accent: "border-t-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Search,
    title: "병목 분석",
    description:
      "첫 리뷰까지 시간, 승인 후 머지까지 시간 등 병목 지점을 찾아드립니다.",
    accent: "border-t-rose-500",
    iconBg: "bg-rose-500/10 text-rose-400",
  },
];

const stats = [
  {
    icon: Clock,
    value: "2.5시간",
    label: "평균 첫 리뷰 시간",
    color: "text-indigo-400",
  },
  {
    icon: TrendingUp,
    value: "오전 10시",
    label: "가장 빠른 머지 시간대",
    color: "text-emerald-400",
  },
  {
    icon: Zap,
    value: "월요일",
    label: "가장 빠른 머지 요일",
    color: "text-amber-400",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const githubAuthUrl = `/api/auth/github`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold">내 PR 언제 머지돼?</h1>
        </div>
        <a
          href={githubAuthUrl}
          className="rounded-lg bg-white text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          GitHub로 시작하기
        </a>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <section className="py-24 text-center relative">
          {/* Glow effect */}
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[300px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none animate-[float-glow_6s_ease-in-out_infinite]" />
          <div className="relative">
            <p className="text-sm font-medium text-indigo-400 mb-4 tracking-wide uppercase">
              GitHub PR Review Analytics
            </p>
            <h2 className="text-5xl font-extrabold tracking-tight mb-6">
              PR 리뷰, 더 빠르게
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                팀 문화, 더 건강하게
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              GitHub PR 리뷰 속도를 추적하고, 실시간 Slack 알림으로
              <br />
              팀의 코드 리뷰 문화를 한 단계 업그레이드하세요.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href={githubAuthUrl}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                무료로 시작하기
              </a>
              <a
                href="#features"
                className="rounded-lg border border-gray-700 px-6 py-3 text-base font-semibold hover:bg-gray-800 transition-colors"
              >
                기능 살펴보기
              </a>
            </div>
          </div>
        </section>

        {/* Stats Preview */}
        <ScrollReveal>
          <section className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-gray-900/80 border border-gray-800 p-6 text-center hover:border-gray-700 transition-colors"
                  >
                    <div className="flex justify-center mb-3">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className={`text-3xl font-bold ${stat.color}`}>
                      <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollReveal>

        {/* Features */}
        <ScrollReveal>
          <section id="features" className="py-24">
            <h3 className="text-3xl font-bold text-center mb-4">주요 기능</h3>
            <p className="text-gray-500 text-center mb-12">
              PR 리뷰 프로세스의 모든 것을 분석합니다
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`group rounded-xl bg-gray-900/60 border border-gray-800 border-t-2 ${feature.accent} p-8 hover:bg-gray-900/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollReveal>

        {/* Example Insights */}
        <section className="py-24">
          <ScrollReveal>
            <h3 className="text-3xl font-bold text-center mb-4">
              이런 인사이트를 얻을 수 있어요
            </h3>
            <p className="text-gray-500 text-center mb-12">
              실제 팀 데이터 기반의 구체적인 분석 결과
            </p>
          </ScrollReveal>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              "김철수님은 평균 2시간 내 리뷰, 이영희님은 평균 1일 소요",
              "100줄 이하 PR은 평균 3시간, 500줄 이상은 2일",
              "우리 팀은 오전 10-11시에 PR이 가장 빨리 머지됨",
              "월요일 올린 PR이 가장 빨리 처리됨, 금요일은 평균 2배 소요",
              "첫 리뷰까지 평균 6시간 vs 승인 후 머지까지 30분",
              "평균 1.8회 수정 후 머지",
            ].map((insight, i) => (
              <ScrollReveal key={insight} delay={i * 100}>
                <div className="flex items-center gap-4 rounded-lg bg-gray-900/60 border border-gray-800 px-5 py-4 hover:border-gray-700 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <p className="text-gray-300 text-sm">{insight}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <ScrollReveal>
          <section className="py-24 text-center">
            <div className="rounded-2xl bg-gradient-to-b from-gray-900 to-gray-900/50 border border-gray-800 p-12 max-w-2xl mx-auto">
              <GitPullRequest className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h3>
              <p className="text-gray-400 mb-8">
                GitHub App 설치 한 번이면 끝. 별도 설정 없이 바로 사용 가능합니다.
              </p>
              <a
                href={githubAuthUrl}
                className="inline-flex items-center gap-3 rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub로 시작하기
              </a>
            </div>
          </section>
        </ScrollReveal>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>&copy; 2025 내 PR 언제 머지돼? All rights reserved.</p>
      </footer>
    </div>
  );
}
