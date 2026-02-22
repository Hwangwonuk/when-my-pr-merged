/**
 * Backfill responseTimeMs for existing Review records that have null values.
 * Also creates missing ReviewRequest records retroactively.
 *
 * Usage: npx tsx scripts/backfill-response-time.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => InstanceType<typeof PrismaClient>)({
  adapter,
});

async function main() {
  const reviews = await prisma.review.findMany({
    where: { responseTimeMs: null },
    include: {
      pullRequest: { select: { id: true, createdAt: true } },
      reviewer: { select: { id: true, login: true } },
    },
  });

  console.log(`Found ${reviews.length} reviews with null responseTimeMs`);

  let updated = 0;
  let requestsCreated = 0;

  for (const review of reviews) {
    const responseTimeMs = BigInt(
      review.submittedAt.getTime() - review.pullRequest.createdAt.getTime()
    );

    // Update review
    await prisma.review.update({
      where: { id: review.id },
      data: { responseTimeMs },
    });
    updated++;

    // Create ReviewRequest if missing
    const existingRequest = await prisma.reviewRequest.findFirst({
      where: {
        pullRequestId: review.pullRequest.id,
        reviewerId: review.reviewer.id,
      },
    });

    if (!existingRequest) {
      await prisma.reviewRequest.create({
        data: {
          pullRequestId: review.pullRequest.id,
          reviewerId: review.reviewer.id,
          requestedAt: review.pullRequest.createdAt,
          fulfilledAt: review.submittedAt,
        },
      });
      requestsCreated++;
    }

    console.log(
      `  [${updated}/${reviews.length}] ${review.reviewer.login}: ${Number(responseTimeMs) / 1000}s`
    );
  }

  console.log(`\nDone: ${updated} reviews updated, ${requestsCreated} ReviewRequests created`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
