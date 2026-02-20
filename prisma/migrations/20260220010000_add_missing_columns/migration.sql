-- AlterTable: Add sync tracking columns to installations
ALTER TABLE "installations" ADD COLUMN "sync_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "installations" ADD COLUMN "synced_at" TIMESTAMP(3);

-- AlterTable: Add daily digest toggle to slack_integrations
ALTER TABLE "slack_integrations" ADD COLUMN "daily_digest_enabled" BOOLEAN NOT NULL DEFAULT true;
