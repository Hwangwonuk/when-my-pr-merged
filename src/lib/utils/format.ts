export function formatDuration(ms: number): string {
  if (ms < 60_000) {
    return `${Math.round(ms / 1000)}초`;
  }
  if (ms < 3_600_000) {
    return `${Math.round(ms / 60_000)}분`;
  }
  if (ms < 86_400_000) {
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.round((ms % 3_600_000) / 60_000);
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.round((ms % 86_400_000) / 3_600_000);
  return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) return "방금 전";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}분 전`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}시간 전`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}일 전`;
  return date.toLocaleDateString("ko-KR");
}

const DAY_NAMES_KO = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function getDayNameKo(dayIndex: number): string {
  return DAY_NAMES_KO[dayIndex] ?? "";
}

export function getPrSizeLabel(additions: number, deletions: number): string {
  const total = additions + deletions;
  if (total <= 100) return "S (1-100줄)";
  if (total <= 300) return "M (101-300줄)";
  if (total <= 500) return "L (301-500줄)";
  return "XL (500줄+)";
}

export function getPrSizeBucket(additions: number, deletions: number): "S" | "M" | "L" | "XL" {
  const total = additions + deletions;
  if (total <= 100) return "S";
  if (total <= 300) return "M";
  if (total <= 500) return "L";
  return "XL";
}
