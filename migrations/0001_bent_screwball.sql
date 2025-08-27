CREATE TABLE "ai_learning_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"insight_data" jsonb NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"progress" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_behavior_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"action_type" text NOT NULL,
	"details" text,
	"points_earned" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" integer DEFAULT 1,
	"experience" integer DEFAULT 0,
	"title" text DEFAULT 'Začátečník',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp DEFAULT now() NOT NULL,
	"streak_type" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "technical_quality" json;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "detected_objects" json;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "wedding_elements" json;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "atmosphere" text;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "people_count" integer;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "emotions" json;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD COLUMN "creative_tips" text;--> statement-breakpoint
CREATE INDEX "idx_insights_type" ON "ai_learning_insights" USING btree ("insight_type");--> statement-breakpoint
CREATE INDEX "idx_insights_category" ON "ai_learning_insights" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_insights_updated" ON "ai_learning_insights" USING btree ("last_updated");