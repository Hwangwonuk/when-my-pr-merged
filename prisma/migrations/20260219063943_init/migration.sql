-- CreateTable
CREATE TABLE "installations" (
    "id" TEXT NOT NULL,
    "github_install_id" INTEGER NOT NULL,
    "account_login" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "account_avatar_url" TEXT,
    "access_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "github_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "installation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "github_id" INTEGER NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "email" TEXT,
    "slack_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pull_requests" (
    "id" TEXT NOT NULL,
    "github_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "additions" INTEGER NOT NULL DEFAULT 0,
    "deletions" INTEGER NOT NULL DEFAULT 0,
    "changed_files" INTEGER NOT NULL DEFAULT 0,
    "author_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "first_review_at" TIMESTAMP(3),
    "first_approval_at" TIMESTAMP(3),
    "merged_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "time_to_first_review_ms" BIGINT,
    "time_to_merge_ms" BIGINT,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "review_cycle_count" INTEGER NOT NULL DEFAULT 0,
    "has_conflict" BOOLEAN NOT NULL DEFAULT false,
    "conflict_detected_at" TIMESTAMP(3),
    "conflict_resolved_at" TIMESTAMP(3),

    CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "github_id" INTEGER NOT NULL,
    "pull_request_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "response_time_ms" BIGINT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_requests" (
    "id" TEXT NOT NULL,
    "pull_request_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "fulfilled_at" TIMESTAMP(3),

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slack_integrations" (
    "id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "bot_token" TEXT NOT NULL,
    "channel_id" TEXT,
    "channel_name" TEXT,
    "webhook_url" TEXT,
    "stale_pr_alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "stale_pr_threshold_hours" INTEGER NOT NULL DEFAULT 24,
    "hot_streak_alert_enabled" BOOLEAN NOT NULL DEFAULT true,
    "weekly_report_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_praise_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "criteria" JSONB NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "action" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "installations_github_install_id_key" ON "installations"("github_install_id");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_github_id_key" ON "repositories"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_installation_id_key" ON "members"("user_id", "installation_id");

-- CreateIndex
CREATE UNIQUE INDEX "pull_requests_github_id_key" ON "pull_requests"("github_id");

-- CreateIndex
CREATE INDEX "pull_requests_repository_id_created_at_idx" ON "pull_requests"("repository_id", "created_at");

-- CreateIndex
CREATE INDEX "pull_requests_author_id_created_at_idx" ON "pull_requests"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "pull_requests_state_created_at_idx" ON "pull_requests"("state", "created_at");

-- CreateIndex
CREATE INDEX "pull_requests_merged_at_idx" ON "pull_requests"("merged_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_github_id_key" ON "reviews"("github_id");

-- CreateIndex
CREATE INDEX "reviews_pull_request_id_submitted_at_idx" ON "reviews"("pull_request_id", "submitted_at");

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_submitted_at_idx" ON "reviews"("reviewer_id", "submitted_at");

-- CreateIndex
CREATE INDEX "review_requests_pull_request_id_idx" ON "review_requests"("pull_request_id");

-- CreateIndex
CREATE INDEX "review_requests_reviewer_id_requested_at_idx" ON "review_requests"("reviewer_id", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "slack_integrations_installation_id_key" ON "slack_integrations"("installation_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_period_key" ON "user_badges"("user_id", "badge_id", "period");

-- CreateIndex
CREATE INDEX "webhook_events_source_event_type_received_at_idx" ON "webhook_events"("source", "event_type", "received_at");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
