import { WebClient } from "@slack/web-api";

const clientCache = new Map<string, WebClient>();

export function getSlackClient(botToken: string): WebClient {
  const cached = clientCache.get(botToken);
  if (cached) return cached;

  const client = new WebClient(botToken);
  clientCache.set(botToken, client);
  return client;
}
