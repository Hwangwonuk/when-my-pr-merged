import { getSlackClient } from "@/lib/slack/app";
import { slackMessages } from "@/lib/slack/messages";

interface SlackConfig {
  botToken: string;
  channelId: string | null;
}

export async function sendFastReviewPraise(
  config: SlackConfig,
  reviewer: string,
  responseTimeMs: number
) {
  if (!config.channelId) return;

  const client = getSlackClient(config.botToken);
  const message = slackMessages.fastReviewPraise({ reviewer, responseTimeMs });

  await client.chat.postMessage({
    channel: config.channelId,
    ...message,
  });
}

export async function sendHotStreakAlert(
  config: SlackConfig,
  user: string,
  count: number
) {
  if (!config.channelId) return;

  const client = getSlackClient(config.botToken);
  const message = slackMessages.hotStreak({ user, count });

  await client.chat.postMessage({
    channel: config.channelId,
    ...message,
  });
}

export async function sendStalePrAlert(
  config: SlackConfig,
  pr: { title: string; number: number; url: string; hours: number; author: string }
) {
  if (!config.channelId) return;

  const client = getSlackClient(config.botToken);
  const message = slackMessages.stalePrAlert(pr);

  await client.chat.postMessage({
    channel: config.channelId,
    ...message,
  });
}

export async function sendMergePrediction(
  config: SlackConfig,
  pr: { title: string; number: number; predictedTime: string }
) {
  if (!config.channelId) return;

  const client = getSlackClient(config.botToken);
  const message = slackMessages.mergePrediction(pr);

  await client.chat.postMessage({
    channel: config.channelId,
    ...message,
  });
}

export async function sendWeeklyReport(
  config: SlackConfig,
  report: Parameters<typeof slackMessages.weeklyReport>[0]
) {
  if (!config.channelId) return;

  const client = getSlackClient(config.botToken);
  const message = slackMessages.weeklyReport(report);

  await client.chat.postMessage({
    channel: config.channelId,
    ...message,
  });
}
