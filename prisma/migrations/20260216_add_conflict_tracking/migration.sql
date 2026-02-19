-- AlterTable
ALTER TABLE "pull_requests" ADD COLUMN "has_conflict" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pull_requests" ADD COLUMN "conflict_detected_at" TIMESTAMP(3);
ALTER TABLE "pull_requests" ADD COLUMN "conflict_resolved_at" TIMESTAMP(3);
