"use client";

import { useState } from "react";

const features = [
  "누가 빨리 리뷰하는지 보인다",
  "언제 머지될지 예측된다",
  "방치된 PR이 알아서 알림 간다",
  "리뷰가 재미있어진다",
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
