"use client";

import useSWR from "swr";
import type {
  OverviewStats,
  ReviewerRanking,
  HourlyPattern,
  DailyPattern,
  SizeAnalysis,
  BottleneckAnalysis,
} from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

type StatsParams = {
  installationId: string;
  repositoryId?: string;
  from: string;
  to: string;
  [key: string]: string | undefined;
};

function buildUrl(path: string, params: StatsParams) {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function useOverviewStats(params: StatsParams | null) {
  return useSWR<OverviewStats>(
    params ? buildUrl("/api/stats/overview", params) : null,
    fetcher
  );
}

export function useReviewerRankings(params: (StatsParams & { limit?: string }) | null) {
  return useSWR<ReviewerRanking[]>(
    params ? buildUrl("/api/stats/reviewers", params) : null,
    fetcher
  );
}

export function useHourlyPatterns(params: StatsParams | null) {
  return useSWR<HourlyPattern[]>(
    params ? buildUrl("/api/stats/patterns", { ...params, type: "hourly" }) : null,
    fetcher
  );
}

export function useDailyPatterns(params: StatsParams | null) {
  return useSWR<DailyPattern[]>(
    params ? buildUrl("/api/stats/patterns", { ...params, type: "daily" }) : null,
    fetcher
  );
}

export function useSizeAnalysis(params: StatsParams | null) {
  return useSWR<SizeAnalysis[]>(
    params ? buildUrl("/api/stats/size-analysis", params) : null,
    fetcher
  );
}

export function useBottleneckAnalysis(params: StatsParams | null) {
  return useSWR<BottleneckAnalysis>(
    params ? buildUrl("/api/stats/bottleneck", params) : null,
    fetcher
  );
}
