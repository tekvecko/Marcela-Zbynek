import {
  users,
  challenges,
  achievements,
  userChallengeProgress,
  userAchievements,
  miniGames,
  userMiniGameScores,
  pointTransactions,
  activityLog,
  type User,
  type UpsertUser,
  type Challenge,
  type InsertChallenge,
  type Achievement,
  type InsertAchievement,
  type UserChallengeProgress,
  type InsertUserChallengeProgress,
  type UserAchievement,
  type InsertUserAchievement,
  type MiniGame,
  type UserMiniGameScore,
  type PointTransaction,
  type InsertPointTransaction,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Challenge operations
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  
  // User challenge progress
  getUserChallengeProgress(userId: string): Promise<UserChallengeProgress[]>;
  getUserChallengeProgressByChallenge(userId: string, challengeId: string): Promise<UserChallengeProgress | undefined>;
  completeChallenge(userId: string, challengeId: string): Promise<UserChallengeProgress>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  initializeUserAchievements(userId: string): Promise<void>;
  
  // Mini-game operations
  getMiniGames(): Promise<MiniGame[]>;
  getUserMiniGameScores(userId: string): Promise<UserMiniGameScore[]>;
  recordMiniGameScore(userId: string, miniGameId: string, score: number): Promise<UserMiniGameScore>;
  
  // Point operations
  addPoints(userId: string, points: number, source: string, sourceId?: string, description?: string): Promise<void>;
  getUserPointTransactions(userId: string, limit?: number): Promise<PointTransaction[]>;
  calculateUserLevel(points: number): { level: number; currentLevelPoints: number; nextLevelPoints: number };
  updateUserLevel(userId: string): Promise<User>;
  
  // Activity operations
  getUserActivity(userId: string, limit?: number): Promise<ActivityLog[]>;
  logActivity(userId: string, action: string, details?: any, pointsEarned?: number): Promise<ActivityLog>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    totalPoints: number;
    level: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
    completedChallenges: number;
    unlockedAchievements: number;
    totalAchievements: number;
    miniGamesPlayed: number;
    bestMiniGameScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim() || 'Player',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Initialize achievements for new users
    await this.initializeUserAchievements(user.id);

    return user;
  }

  // Challenge operations
  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.isActive, true)).orderBy(challenges.points);
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challengeData: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values(challengeData).returning();
    return challenge;
  }

  // User challenge progress
  async getUserChallengeProgress(userId: string): Promise<UserChallengeProgress[]> {
    return await db
      .select()
      .from(userChallengeProgress)
      .where(eq(userChallengeProgress.userId, userId))
      .orderBy(desc(userChallengeProgress.createdAt));
  }

  async getUserChallengeProgressByChallenge(userId: string, challengeId: string): Promise<UserChallengeProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userChallengeProgress)
      .where(and(
        eq(userChallengeProgress.userId, userId),
        eq(userChallengeProgress.challengeId, challengeId)
      ));
    return progress;
  }

  async completeChallenge(userId: string, challengeId: string): Promise<UserChallengeProgress> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const existingProgress = await this.getUserChallengeProgressByChallenge(userId, challengeId);
    
    if (existingProgress?.isCompleted) {
      return existingProgress;
    }

    const [progress] = await db
      .insert(userChallengeProgress)
      .values({
        userId,
        challengeId,
        isCompleted: true,
        completedAt: new Date(),
        pointsAwarded: challenge.points,
      })
      .onConflictDoUpdate({
        target: [userChallengeProgress.userId, userChallengeProgress.challengeId],
        set: {
          isCompleted: true,
          completedAt: new Date(),
          pointsAwarded: challenge.points,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Add points and log activity
    await this.addPoints(userId, challenge.points, 'challenge', challengeId, `Completed challenge: ${challenge.title}`);
    await this.logActivity(userId, 'challenge_completed', { challengeId, challengeTitle: challenge.title }, challenge.points);

    return progress;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        isUnlocked: userAchievements.isUnlocked,
        progress: userAchievements.progress,
        maxProgress: userAchievements.maxProgress,
        unlockedAt: userAchievements.unlockedAt,
        pointsAwarded: userAchievements.pointsAwarded,
        createdAt: userAchievements.createdAt,
        updatedAt: userAchievements.updatedAt,
        achievement: {
          id: achievements.id,
          title: achievements.title,
          description: achievements.description,
          icon: achievements.icon,
          points: achievements.points,
          category: achievements.category,
          requirement: achievements.requirement,
          isActive: achievements.isActive,
          createdAt: achievements.createdAt,
          updatedAt: achievements.updatedAt,
        }
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.isUnlocked), userAchievements.createdAt);
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement> {
    const [userAchievement] = await db
      .update(userAchievements)
      .set({ 
        progress,
        updatedAt: new Date()
      })
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .returning();

    // Check if achievement should be unlocked
    if (!userAchievement.isUnlocked && progress >= userAchievement.maxProgress) {
      return await this.unlockAchievement(userId, achievementId);
    }

    return userAchievement;
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const achievement = await db.select().from(achievements).where(eq(achievements.id, achievementId)).then(r => r[0]);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const [userAchievement] = await db
      .update(userAchievements)
      .set({ 
        isUnlocked: true,
        unlockedAt: new Date(),
        pointsAwarded: achievement.points,
        progress: userAchievements.maxProgress,
        updatedAt: new Date()
      })
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .returning();

    // Add points and log activity
    await this.addPoints(userId, achievement.points, 'achievement', achievementId, `Unlocked achievement: ${achievement.title}`);
    await this.logActivity(userId, 'achievement_unlocked', { achievementId, achievementTitle: achievement.title }, achievement.points);

    return userAchievement;
  }

  async initializeUserAchievements(userId: string): Promise<void> {
    const allAchievements = await this.getAchievements();
    const existingUserAchievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const existingAchievementIds = new Set(existingUserAchievements.map(ua => ua.achievementId));

    const newUserAchievements = allAchievements
      .filter(a => !existingAchievementIds.has(a.id))
      .map(achievement => ({
        userId,
        achievementId: achievement.id,
        maxProgress: (achievement.requirement as any)?.target || 1,
      }));

    if (newUserAchievements.length > 0) {
      await db.insert(userAchievements).values(newUserAchievements);
    }
  }

  // Mini-game operations
  async getMiniGames(): Promise<MiniGame[]> {
    return await db.select().from(miniGames).where(eq(miniGames.isActive, true));
  }

  async getUserMiniGameScores(userId: string): Promise<UserMiniGameScore[]> {
    return await db
      .select()
      .from(userMiniGameScores)
      .where(eq(userMiniGameScores.userId, userId))
      .orderBy(desc(userMiniGameScores.score));
  }

  async recordMiniGameScore(userId: string, miniGameId: string, score: number): Promise<UserMiniGameScore> {
    const pointsEarned = Math.floor(score / 100); // Simple points calculation

    const [gameScore] = await db
      .insert(userMiniGameScores)
      .values({
        userId,
        miniGameId,
        score,
        pointsEarned,
      })
      .returning();

    // Add points and log activity
    await this.addPoints(userId, pointsEarned, 'minigame', miniGameId, `Mini-game score: ${score}`);
    await this.logActivity(userId, 'minigame_played', { miniGameId, score }, pointsEarned);

    return gameScore;
  }

  // Point operations
  calculateUserLevel(points: number): { level: number; currentLevelPoints: number; nextLevelPoints: number } {
    // Level calculation: Level = floor(sqrt(points / 100)) + 1
    // Each level requires more points: Level 1: 0-99, Level 2: 100-399, Level 3: 400-899, etc.
    const level = Math.floor(Math.sqrt(points / 100)) + 1;
    const levelStartPoints = Math.pow(level - 1, 2) * 100;
    const nextLevelPoints = Math.pow(level, 2) * 100;
    const currentLevelPoints = points - levelStartPoints;
    
    return {
      level,
      currentLevelPoints,
      nextLevelPoints: nextLevelPoints - levelStartPoints,
    };
  }

  async updateUserLevel(userId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { level, currentLevelPoints } = this.calculateUserLevel(user.totalPoints);
    
    const previousLevel = user.level;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        level,
        currentLevelPoints,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log level up if level increased
    if (level > previousLevel) {
      await this.logActivity(userId, 'level_up', { previousLevel, newLevel: level });
    }

    return updatedUser;
  }

  async addPoints(userId: string, points: number, source: string, sourceId?: string, description?: string): Promise<void> {
    // Add point transaction
    await db.insert(pointTransactions).values({
      userId,
      points,
      source,
      sourceId,
      description,
    });

    // Update user total points
    await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update user level
    await this.updateUserLevel(userId);
  }

  async getUserPointTransactions(userId: string, limit: number = 50): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit);
  }

  // Activity operations
  async getUserActivity(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async logActivity(userId: string, action: string, details?: any, pointsEarned: number = 0): Promise<ActivityLog> {
    const [activity] = await db
      .insert(activityLog)
      .values({
        userId,
        action,
        details,
        pointsEarned,
      })
      .returning();

    return activity;
  }

  // Statistics
  async getUserStats(userId: string): Promise<{
    totalPoints: number;
    level: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
    completedChallenges: number;
    unlockedAchievements: number;
    totalAchievements: number;
    miniGamesPlayed: number;
    bestMiniGameScore: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { level, currentLevelPoints, nextLevelPoints } = this.calculateUserLevel(user.totalPoints);

    const [completedChallengesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userChallengeProgress)
      .where(and(
        eq(userChallengeProgress.userId, userId),
        eq(userChallengeProgress.isCompleted, true)
      ));

    const [unlockedAchievementsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isUnlocked, true)
      ));

    const [totalAchievementsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(achievements)
      .where(eq(achievements.isActive, true));

    const [miniGamesPlayedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userMiniGameScores)
      .where(eq(userMiniGameScores.userId, userId));

    const [bestScore] = await db
      .select({ maxScore: sql<number>`max(${userMiniGameScores.score})::int` })
      .from(userMiniGameScores)
      .where(eq(userMiniGameScores.userId, userId));

    return {
      totalPoints: user.totalPoints,
      level,
      currentLevelPoints,
      nextLevelPoints,
      completedChallenges: completedChallengesCount.count || 0,
      unlockedAchievements: unlockedAchievementsCount.count || 0,
      totalAchievements: totalAchievementsCount.count || 0,
      miniGamesPlayed: miniGamesPlayedCount.count || 0,
      bestMiniGameScore: bestScore.maxScore || 0,
    };
  }
}

export const storage = new DatabaseStorage();
