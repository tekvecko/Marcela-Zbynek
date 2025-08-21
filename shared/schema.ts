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
  passwordHash: varchar("password_hash"),
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
}, (table) => [
  index("idx_photos_created_at").on(table.createdAt),
  index("idx_photos_quest_id").on(table.questId),
  index("idx_photos_uploader").on(table.uploaderName),
  index("idx_photos_verified").on(table.isVerified),
]);

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
}, (table) => [
  index("idx_progress_participant").on(table.participantName),
  index("idx_progress_quest_participant").on(table.questId, table.participantName),
  index("idx_progress_completed").on(table.isCompleted),
]);

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

export const insertAuthUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  profileImageUrl: true,
  isAdmin: true,
});

export const loginSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});

export const registerSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
});

// Auth session table for custom authentication
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: varchar("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type AuthUser = User;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type QuestChallenge = typeof questChallenges.$inferSelect;
export type InsertQuestChallenge = z.infer<typeof insertQuestChallengeSchema>;
export type UploadedPhoto = typeof uploadedPhotos.$inferSelect;
export type InsertUploadedPhoto = z.infer<typeof insertUploadedPhotoSchema>;
export type PhotoLike = typeof photoLikes.$inferSelect;
export type InsertPhotoLike = z.infer<typeof insertPhotoLikeSchema>;
export type QuestProgress = typeof questProgress.$inferSelect;
export type InsertQuestProgress = z.infer<typeof insertQuestProgressSchema>;
