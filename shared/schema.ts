import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questChallenges = pgTable("quest_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetPhotos: integer("target_photos").notNull().default(1),
  points: integer("points").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const uploadedPhotos = pgTable("uploaded_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploaderName: text("uploader_name").notNull(),
  questId: varchar("quest_id").references(() => questChallenges.id),
  likes: integer("likes").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationScore: integer("verification_score").default(0), // 0-100
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const photoLikes = pgTable("photo_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  photoId: varchar("photo_id").notNull().references(() => uploadedPhotos.id),
  voterName: text("voter_name").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const questProgress = pgTable("quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull().references(() => questChallenges.id),
  participantName: text("participant_name").notNull(),
  photosUploaded: integer("photos_uploaded").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertQuestChallengeSchema = createInsertSchema(questChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertUploadedPhotoSchema = createInsertSchema(uploadedPhotos).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertPhotoLikeSchema = createInsertSchema(photoLikes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestProgressSchema = createInsertSchema(questProgress).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type QuestChallenge = typeof questChallenges.$inferSelect;
export type InsertQuestChallenge = z.infer<typeof insertQuestChallengeSchema>;
export type UploadedPhoto = typeof uploadedPhotos.$inferSelect;
export type InsertUploadedPhoto = z.infer<typeof insertUploadedPhotoSchema>;
export type PhotoLike = typeof photoLikes.$inferSelect;
export type InsertPhotoLike = z.infer<typeof insertPhotoLikeSchema>;
export type QuestProgress = typeof questProgress.$inferSelect;
export type InsertQuestProgress = z.infer<typeof insertQuestProgressSchema>;
