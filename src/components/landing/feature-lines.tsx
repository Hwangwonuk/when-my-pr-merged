"use client";

import { useState } from "react";

const features = [
  "리뷰 응답 시간 추적",
  "시간대별 머지 패턴",
  "PR 크기별 분석",
  "리뷰어 랭킹 & 배지",
];

export function FeatureLines() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className="space-y-3 md:space-y-4"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {features.map((feature, i) => (
        <p
          key={feature}
          className="text-3xl md:text-6xl font-bold transition-colors duration-300"
          style={{
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            color:
              hoveredIndex === null
                ? i === 0
                  ? "#ffffff"
                  : "#4b5563"
                : hoveredIndex === i
                  ? "#ffffff"
                  : "#374151",
          }}
          onMouseEnter={() => setHoveredIndex(i)}
        >
          {feature}
        </p>
      ))}
    </div>
  );
}
