
import { relations } from "drizzle-orm/relations";
import { 
  users, questChallenges, uploadedPhotos, photoLikes, questProgress, 
  authSessions, miniGames, miniGameScores, userBehaviorLogs, 
  aiLearningInsights, userAchievements, userStreaks, userLevels 
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  authSessions: many(authSessions),
  questProgress: many(questProgress),
  achievements: many(userAchievements),
  streaks: many(userStreaks),
  levels: many(userLevels),
  behaviorLogs: many(userBehaviorLogs),
}));

export const questChallengesRelations = relations(questChallenges, ({ many }) => ({
  uploadedPhotos: many(uploadedPhotos),
  questProgress: many(questProgress),
}));

export const uploadedPhotosRelations = relations(uploadedPhotos, ({ one, many }) => ({
  questChallenge: one(questChallenges, {
    fields: [uploadedPhotos.questId],
    references: [questChallenges.id],
  }),
  likes: many(photoLikes),
}));

export const photoLikesRelations = relations(photoLikes, ({ one }) => ({
  photo: one(uploadedPhotos, {
    fields: [photoLikes.photoId],
    references: [uploadedPhotos.id],
  }),
}));

export const questProgressRelations = relations(questProgress, ({ one }) => ({
  questChallenge: one(questChallenges, {
    fields: [questProgress.questId],
    references: [questChallenges.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const miniGameScoresRelations = relations(miniGameScores, ({ one }) => ({
  game: one(miniGames, {
    fields: [miniGameScores.gameId],
    references: [miniGames.id],
  }),
}));

export const miniGamesRelations = relations(miniGames, ({ many }) => ({
  scores: many(miniGameScores),
}));
