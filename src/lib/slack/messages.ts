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

  mergePrediction: (params: MergePredictionParams) => ({
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `:crystal_ball: PR #${params.number} "${params.title}" 머지 예상: *${params.predictedTime}*`,
        },
      },
    ],
  }),

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
