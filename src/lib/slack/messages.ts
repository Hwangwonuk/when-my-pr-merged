import { formatDuration } from "@/lib/utils/format";

interface StalePrAlertParams {
  title: string;
  number: number;
  url: string;
  hours: number;
  author: string;
}

interface HotStreakParams {
  user: string;
  count: number;
}

interface FastReviewPraiseParams {
  reviewer: string;
  responseTimeMs: number;
}

interface MergePredictionParams {
  title: string;
  number: number;
  predictedTime: string;
  confidenceLevel?: "high" | "medium" | "low";
}

interface WeeklyReportParams {
  orgName: string;
  totalPRs: number;
  mergedPRs: number;
  avgMergeTime: string;
  avgFirstReviewTime: string;
  topReviewer: string;
  topReviewerCount: number;
  period: string;
}

export const slackMessages = {
  stalePrAlert: (params: StalePrAlertParams) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:eyes: *리뷰 대기 중!* PR #${params.number}이 ${params.hours}시간째 리뷰가 없습니다.\n<${params.url}|${params.title}> by ${params.author}`,
        },
      },
      {
        type: "actions" as const,
        elements: [
          {
            type: "button" as const,
            text: { type: "plain_text" as const, text: "리뷰하러 가기 :rocket:" },
            url: params.url,
          },
        ],
      },
    ],
  }),

  hotStreak: (params: HotStreakParams) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:fire: *Hot Streak!* ${params.user}님의 연속 ${params.count}개 PR이 1시간 내 머지됨!`,
        },
      },
    ],
  }),

  fastReviewPraise: (params: FastReviewPraiseParams) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:zap: *번개같은 리뷰 감사합니다!* ${params.reviewer}님이 ${formatDuration(params.responseTimeMs)} 만에 리뷰를 완료했습니다!`,
        },
      },
    ],
  }),

  mergePrediction: (params: MergePredictionParams) => {
    const confidenceIcons: Record<string, string> = {
      high: ":large_green_circle:",
      medium: ":large_yellow_circle:",
      low: ":red_circle:",
    };
    const confidenceLabels: Record<string, string> = {
      high: "높음",
      medium: "보통",
      low: "낮음",
    };
    const level = params.confidenceLevel ?? "medium";
    const confidenceText = ` ${confidenceIcons[level]} 신뢰도: ${confidenceLabels[level]}`;

    return {
      blocks: [
        {
          type: "section" as const,
          text: {
            type: "mrkdwn" as const,
            text: `:crystal_ball: PR #${params.number} "${params.title}" 머지 예상: *${params.predictedTime}*${confidenceText}`,
          },
        },
      ],
    };
  },

  weeklyReport: (params: WeeklyReportParams) => ({
    blocks: [
      {
        type: "header" as const,
        text: {
          type: "plain_text" as const,
          text: `:bar_chart: ${params.orgName} 주간 PR 리포트 (${params.period})`,
        },
      },
      {
        type: "section" as const,
        fields: [
          { type: "mrkdwn" as const, text: `*총 PR 수*\n${params.totalPRs}개` },
          { type: "mrkdwn" as const, text: `*머지된 PR*\n${params.mergedPRs}개` },
          { type: "mrkdwn" as const, text: `*평균 머지 시간*\n${params.avgMergeTime}` },
          { type: "mrkdwn" as const, text: `*평균 첫 리뷰 시간*\n${params.avgFirstReviewTime}` },
        ],
      },
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:trophy: *이번 주 리뷰왕:* ${params.topReviewer} (${params.topReviewerCount}건 리뷰)`,
        },
      },
    ],
  }),

  reviewedButStale: (params: { title: string; number: number; url: string; hours: number; author: string; reviewState: string }) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:warning: *리뷰 후 방치 중!* PR #${params.number}이 ${params.reviewState} 상태로 ${params.hours}시간째 업데이트가 없습니다.\n<${params.url}|${params.title}> by ${params.author}`,
        },
      },
      {
        type: "actions" as const,
        elements: [
          {
            type: "button" as const,
            text: { type: "plain_text" as const, text: "확인하러 가기 :eyes:" },
            url: params.url,
          },
        ],
      },
    ],
  }),

  approvedButUnmerged: (params: { title: string; number: number; url: string; hours: number; author: string }) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:white_check_mark: *승인된 PR 미머지!* PR #${params.number}이 승인 후 ${params.hours}시간째 머지되지 않았습니다.\n<${params.url}|${params.title}> by ${params.author}`,
        },
      },
      {
        type: "actions" as const,
        elements: [
          {
            type: "button" as const,
            text: { type: "plain_text" as const, text: "머지하러 가기 :rocket:" },
            url: params.url,
          },
        ],
      },
    ],
  }),

  testMessage: (channelName: string) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:white_check_mark: *When My PR Merged* 연동이 완료되었습니다!\n#${channelName} 채널로 알림이 전송됩니다.`,
        },
      },
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: "이 채널에서 받을 수 있는 알림:\n• :eyes: 방치 PR 알림\n• :zap: 빠른 리뷰 칭찬\n• :fire: Hot Streak 알림\n• :bar_chart: 일간 다이제스트 / 주간 리포트",
        },
      },
    ],
  }),

  prSizeGuide: (linesChanged: number) => {
    if (linesChanged <= 100) {
      return `:white_check_mark: 이 PR은 리뷰하기 좋은 크기입니다 (${linesChanged}줄)`;
    }
    if (linesChanged <= 300) {
      return `:large_yellow_circle: 중간 크기의 PR입니다 (${linesChanged}줄). 가능하면 더 작게 나눠보세요.`;
    }
    return `:red_circle: 큰 PR입니다 (${linesChanged}줄). 리뷰에 시간이 오래 걸릴 수 있습니다.`;
  },
};
