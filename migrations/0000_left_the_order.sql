CREATE TABLE "auth_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "mini_game_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar NOT NULL,
	"player_email" text NOT NULL,
	"player_name" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer NOT NULL,
	"time_spent" integer,
	"game_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"game_type" varchar NOT NULL,
	"game_data" jsonb NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"time_limit" integer DEFAULT 60,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_id" varchar NOT NULL,
	"voter_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_challenges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_photos" integer DEFAULT 1 NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" varchar NOT NULL,
	"participant_name" text NOT NULL,
	"photos_uploaded" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploader_name" text NOT NULL,
	"quest_id" varchar,
	"likes" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_score" integer DEFAULT 0,
	"ai_analysis" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password_hash" varchar,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_game_scores" ADD CONSTRAINT "mini_game_scores_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_photo_id_uploaded_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."uploaded_photos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_quest_challenges_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quest_challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_photos" ADD CONSTRAINT "uploaded_photos_quest_id_quest_challenges_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quest_challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_scores_game" ON "mini_game_scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_player" ON "mini_game_scores" USING btree ("player_email");--> statement-breakpoint
CREATE INDEX "idx_game_scores_score" ON "mini_game_scores" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_progress_participant" ON "quest_progress" USING btree ("participant_name");--> statement-breakpoint
CREATE INDEX "idx_progress_quest_participant" ON "quest_progress" USING btree ("quest_id","participant_name");--> statement-breakpoint
CREATE INDEX "idx_progress_completed" ON "quest_progress" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_photos_created_at" ON "uploaded_photos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_photos_quest_id" ON "uploaded_photos" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "idx_photos_uploader" ON "uploaded_photos" USING btree ("uploader_name");--> statement-breakpoint
CREATE INDEX "idx_photos_verified" ON "uploaded_photos" USING btree ("is_verified");