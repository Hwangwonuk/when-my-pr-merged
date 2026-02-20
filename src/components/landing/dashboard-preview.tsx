"use client";

import { useState } from "react";

const tabs = ["개요", "통계", "리뷰어"] as const;

function OverviewTab() {
  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-6 border-b border-gray-800/50 pb-4 mb-5">
        {[
          { label: "총 PR 수", value: "142", sub: "머지: 128 / 오픈: 14" },
          { label: "평균 머지 시간", value: "4.2시간", trend: "-12.3%", good: true },
          { label: "평균 첫 리뷰", value: "1.8시간", trend: "-8.1%", good: true },
          { label: "머지율", value: "90.1%", sub: "평균 1.3회 수정 후 머지" },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[10px] text-gray-600 mb-0.5">{s.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-semibold tabular-nums tracking-tight text-white">{s.value}</p>
              {"trend" in s && s.trend && (
                <span className={`text-[10px] tabular-nums ${s.good ? "text-green-400" : "text-red-400"}`}>
                  {s.good ? "↓" : "↑"} {s.trend}
                </span>
              )}
            </div>
            {s.sub && <p className="text-[10px] text-gray-700 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Reviewer list */}
      <p className="text-[11px] text-gray-500 mb-2">Top 리뷰어</p>
      <div className="space-y-0">
        {[
          { rank: 1, name: "kim-dev", time: "47분", reviews: 32 },
          { rank: 2, name: "lee-senior", time: "1.2시간", reviews: 28 },
          { rank: 3, name: "park-lead", time: "1.8시간", reviews: 24 },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-3">{r.rank}</span>
              <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-500">
                {r.name[0].toUpperCase()}
              </div>
              <span className="text-[11px] text-gray-300">{r.name}</span>
            </div>
            <span className="text-[11px] text-gray-600 tabular-nums">{r.time} · {r.reviews}건</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div>
      {/* Insights */}
      <div className="grid grid-cols-2 gap-6 border-b border-gray-800/50 pb-4 mb-5">
        <div>
          <p className="text-[10px] text-gray-600 mb-0.5">가장 빠른 머지 시간대</p>
          <p className="text-lg font-semibold tabular-nums tracking-tight text-green-400">오전 10시 - 11시</p>
          <p className="text-[10px] text-gray-700 mt-0.5">이 시간대에 올린 PR이 가장 빨리 머지됩니다</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600 mb-0.5">가장 빠른 머지 요일</p>
          <p className="text-lg font-semibold tracking-tight text-indigo-400">화요일</p>
          <p className="text-[10px] text-gray-700 mt-0.5">화요일에 올린 PR이 가장 빨리 처리됩니다</p>
        </div>
      </div>

      {/* Heatmap mock */}
      <p className="text-[11px] text-gray-500 mb-1.5">시간대별 머지 속도</p>
      <div className="grid grid-cols-12 gap-0.5">
        {Array.from({ length: 24 }, (_, i) => {
          const intensities = [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1, 0.2, 0.4, 0.7, 0.8, 0.6, 0.5, 0.5, 0.6, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05];
          return (
            <div
              key={i}
              className="aspect-square rounded-[2px] flex items-center justify-center text-[7px] text-gray-500"
              style={{ backgroundColor: `rgba(99, 102, 241, ${intensities[i]})` }}
            >
              {i}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-700">
        <span>빠름</span>
        <div className="flex gap-px">
          {[0.8, 0.5, 0.25, 0.1].map((o) => (
            <div key={o} className="w-2.5 h-2 rounded-[1px]" style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }} />
          ))}
        </div>
        <span>느림</span>
      </div>
    </div>
  );
}

function ReviewersTab() {
  return (
    <div>
      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800/50">
            {["#", "리뷰어", "평균 응답", "리뷰 수", "승인율"].map((h) => (
              <th key={h} className="text-left text-[9px] text-gray-600 font-medium py-1.5 px-1.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { rank: 1, name: "kim-dev", time: "47분", count: 32, rate: "94%" },
            { rank: 2, name: "lee-senior", time: "1.2시간", count: 28, rate: "89%" },
            { rank: 3, name: "park-lead", time: "1.8시간", count: 24, rate: "92%" },
            { rank: 4, name: "choi-fe", time: "2.1시간", count: 19, rate: "87%" },
            { rank: 5, name: "jung-be", time: "2.4시간", count: 16, rate: "91%" },
          ].map((r) => (
            <tr key={r.name} className="border-b border-gray-800/20 hover:bg-gray-800/30 transition-colors">
              <td className="text-[10px] text-gray-600 py-1.5 px-1.5">{r.rank}</td>
              <td className="py-1.5 px-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-500">
                    {r.name[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] text-white">{r.name}</span>
                </div>
              </td>
              <td className="text-[10px] text-gray-400 tabular-nums py-1.5 px-1.5">{r.time}</td>
              <td className="text-[10px] text-gray-400 tabular-nums py-1.5 px-1.5">{r.count}건</td>
              <td className="text-[10px] text-gray-400 tabular-nums py-1.5 px-1.5">{r.rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("개요");

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-gray-800/50 px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-[11px] transition-colors duration-200 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-500 text-white"
                : "border-transparent text-gray-600 hover:text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[9px] text-gray-700 font-mono">DEMO DATA</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "개요" && <OverviewTab />}
        {activeTab === "통계" && <StatsTab />}
        {activeTab === "리뷰어" && <ReviewersTab />}
      </div>
    </div>
  );
}
