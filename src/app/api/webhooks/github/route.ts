import { NextRequest, NextResponse, after } from "next/server";
import { verifyGitHubWebhook } from "@/lib/github/webhooks";
import { handlePullRequestEvent } from "@/lib/github/handlers/pull-request";
import { handlePullRequestReviewEvent } from "@/lib/github/handlers/pull-request-review";
import {
  handleInstallationEvent,
  handleInstallationRepositoriesEvent,
} from "@/lib/github/handlers/installation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  // Verify webhook signature
  if (!verifyGitHubWebhook(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Log the raw event
  await prisma.webhookEvent.create({
    data: {
      source: "github",
      eventType: event!,
      action: payload.action ?? null,
      payload,
    },
  });

  // Route to appropriate handler
  try {
    switch (event) {
      case "pull_request":
        await handlePullRequestEvent(payload);
        break;
      case "pull_request_review":
        await handlePullRequestReviewEvent(payload);
        break;
      case "installation": {
        const syncPromise = await handleInstallationEvent(payload);
        if (syncPromise) after(() => syncPromise);
        break;
      }
      case "installation_repositories":
        await handleInstallationRepositoriesEvent(payload);
        break;
    }

    // Mark event as processed
    await prisma.webhookEvent.updateMany({
      where: {
        source: "github",
        eventType: event!,
        processed: false,
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Webhook processing error: ${event}/${payload.action}`, error);

    // Log error but still return 200 to prevent GitHub from retrying
    await prisma.webhookEvent.updateMany({
      where: {
        source: "github",
        eventType: event!,
        processed: false,
      },
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  return NextResponse.json({ received: true });
}
