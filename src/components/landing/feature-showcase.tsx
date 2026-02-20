"use client";

import { useState } from "react";

const stories = [
  {
    id: "measure",
    label: "측정",
    headline: "보이지 않던 시간이\n숫자가 됩니다",
    desc: "PR 오픈부터 머지까지, 모든 구간을 자동으로 기록합니다.",
  },
  {
    id: "discover",
    label: "발견",
    headline: "시간이 멈추는 곳을\n찾아냅니다",
    desc: "병목 구간, 시간대별 패턴, 컨플릭트 빈도를 시각화합니다.",
  },
  {
    id: "improve",
    label: "개선",
    headline: "누구에게, 언제\n리뷰를 요청할지",
    desc: "리뷰어 응답 속도와 PR 크기별 최적 전략을 제안합니다.",
  },
  {
    id: "track",
    label: "추적",
    headline: "매주 나아지고 있는지\n확인합니다",
    desc: "주간 리포트와 리더보드로 팀의 변화를 추적합니다.",
  },
] as const;

type StoryId = (typeof stories)[number]["id"];

/* ── Visual: 측정 ── */
function MeasureVisual() {
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-8">
      {[
        { label: "총 PR", value: "142", sub: "머지 128 · 오픈 14" },
        {
          label: "평균 머지 시간",
          value: "4.2h",
          trend: "↓ 12%",
          good: true,
        },
        {
          label: "첫 리뷰까지",
          value: "1.8h",
          trend: "↓ 8%",
          good: true,
        },
        { label: "머지율", value: "90.1%", sub: "평균 1.3회 수정" },
      ].map((s) => (
        <div key={s.label}>
          <p className="text-[11px] text-gray-600 mb-1">{s.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-semibold tabular-nums tracking-tight text-white">
              {s.value}
            </span>
            {"trend" in s && s.trend && (
              <span className="text-xs text-green-400 tabular-nums">
                {s.trend}
              </span>
            )}
          </div>
          {s.sub && (
            <p className="text-[11px] text-gray-700 mt-1">{s.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Visual: 발견 ── */
function DiscoverVisual() {
  const stages = [
    { label: "오픈 → 첫 리뷰", time: "3.2h", pct: 55 },
    { label: "첫 리뷰 → 승인", time: "2.1h", pct: 36 },
    { label: "승인 → 머지", time: "0.5h", pct: 9 },
  ];
  return (
    <div className="space-y-5">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-500">{s.label}</span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              {s.time}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${s.pct}%`,
                backgroundColor: `rgba(99, 102, 241, ${1 - i * 0.25})`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gray-600 pt-2">
        병목 구간: <span className="text-indigo-400">오픈 → 첫 리뷰</span> —
        전체의 55%
      </p>
    </div>
  );
}

/* ── Visual: 개선 ── */
function ImproveVisual() {
  const reviewers = [
    { name: "kim-dev", time: "47분", rate: "94%", recommended: true },
    { name: "lee-senior", time: "1.2시간", rate: "89%" },
    { name: "park-lead", time: "1.8시간", rate: "92%" },
  ];
  return (
    <div>
      <p className="text-[11px] text-gray-600 mb-3">추천 리뷰어</p>
      <div className="space-y-0.5">
        {reviewers.map((r) => (
          <div
            key={r.name}
            className={`flex items-center justify-between py-2.5 px-3 -mx-3 rounded transition-colors duration-200 ${
              "recommended" in r && r.recommended ? "bg-indigo-500/10" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[9px] text-gray-500">
                {r.name[0].toUpperCase()}
              </div>
              <span className="text-[12px] text-gray-300">{r.name}</span>
              {"recommended" in r && r.recommended && (
                <span className="text-[9px] text-indigo-400 font-medium">
                  추천
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-600 tabular-nums">
              {r.time} · {r.rate}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-800/40">
        <p className="text-[11px] text-gray-600">
          최적 시간대 <span className="text-indigo-400">화 10–11시</span>
        </p>
      </div>
    </div>
  );
}

/* ── Visual: 추적 ── */
function TrackVisual() {
  const weeks = [
    { label: "1주차", value: 6.2, pct: 100 },
    { label: "2주차", value: 4.8, pct: 77 },
    { label: "3주차", value: 3.9, pct: 63 },
    { label: "4주차", value: 3.2, pct: 52 },
  ];
  return (
    <div>
      <p className="text-[11px] text-gray-600 mb-4">평균 머지 시간 추이</p>
      <div className="space-y-2.5">
        {weeks.map((w, i) => (
          <div key={w.label} className="flex items-center gap-3">
            <span className="text-[11px] text-gray-600 w-10 tabular-nums shrink-0">
              {w.label}
            </span>
            <div className="flex-1 h-5 bg-gray-800/40 rounded overflow-hidden">
              <div
                className="h-full rounded flex items-center px-2"
                style={{
                  width: `${w.pct}%`,
                  backgroundColor: `rgba(99, 102, 241, ${0.3 + (3 - i) * 0.15})`,
                }}
              >
                <span className="text-[10px] text-white/80 tabular-nums">
                  {w.value}h
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between">
        <span className="text-[11px] text-gray-600">4주간 변화</span>
        <span className="text-sm text-green-400 tabular-nums font-medium">
          ↓ 48%
        </span>
      </div>
    </div>
  );
}

const visualMap: Record<StoryId, React.ComponentType> = {
  measure: MeasureVisual,
  discover: DiscoverVisual,
  improve: ImproveVisual,
  track: TrackVisual,
};

export function FeatureShowcase() {
  const [active, setActive] = useState<StoryId>("measure");
  const Visual = visualMap[active];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-20 items-start">
      {/* Left: Story navigation */}
      <nav>
        {stories.map((story) => {
          const isActive = active === story.id;
          return (
            <button
              key={story.id}
              onClick={() => setActive(story.id)}
              onMouseEnter={() => setActive(story.id)}
              className={`block w-full text-left border-l-2 pl-6 py-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isActive
                  ? "border-indigo-500"
                  : "border-gray-800/50 hover:border-gray-700"
              }`}
            >
              <p
                className={`font-mono text-[11px] uppercase tracking-widest mb-1.5 transition-colors duration-300 ${
                  isActive ? "text-indigo-400" : "text-gray-700"
                }`}
              >
                {story.label}
              </p>
              <h3
                className={`text-lg font-semibold leading-snug whitespace-pre-line transition-colors duration-300 ${
                  isActive ? "text-white" : "text-gray-600"
                }`}
              >
                {story.headline}
              </h3>
              <div
                className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive
                    ? "max-h-20 opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <p className="text-sm text-gray-500 leading-relaxed">
                  {story.desc}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Right: Visual preview */}
      <div className="md:sticky md:top-32">
        <div className="border border-gray-800/30 rounded-lg p-6 md:p-8 bg-gray-900/20">
          <div
            key={active}
            className="animate-[feature-in_0.35s_cubic-bezier(0.4,0,0.2,1)]"
          >
            <Visual />
          </div>
        </div>
      </div>
    </div>
  );
}
