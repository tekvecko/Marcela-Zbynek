import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import {
  users,
  challenges,
  submissions,
  achievements,
  userStats,
  type User,
  type InsertUser,
  type Challenge,
  type InsertChallenge,
  type Submission,
  type InsertSubmission,
  type Achievement,
  type InsertAchievement,
  type UserStats,
  type InsertUserStats,
  type UserWithProgress,
  type ChallengeWithSubmissions,
  type LeaderboardEntry,
} from '../shared/schema';

let db: ReturnType<typeof drizzle>;

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool);
} else {
  throw new Error("DATABASE_URL environment variable is required");
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User>;
  getUserWithProgress(userId: number): Promise<UserWithProgress | null>;

  // Challenges
  getChallenges(): Promise<Challenge[]>;
  getActiveChallenge(challengeId: number): Promise<Challenge | null>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallengesWithSubmissions(userId: number): Promise<ChallengeWithSubmissions[]>;
  incrementChallengeParticipants(challengeId: number): Promise<void>;
  incrementChallengeSubmissions(challengeId: number): Promise<void>;

  // Submissions
  getSubmission(id: number): Promise<Submission | null>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getUserSubmissions(userId: number): Promise<Submission[]>;
  approveSubmission(submissionId: number, points: number): Promise<Submission>;

  // Achievements
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Stats and Leaderboard
  getUserStats(userId: number, week?: string): Promise<UserStats | null>;
  updateUserStats(stats: InsertUserStats): Promise<UserStats>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
}

export class MemStorage implements IStorage {
  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserPoints(userId: number, points: number): Promise<User> {
    const result = await db
      .update(users)
      .set({ 
        points: sql`${users.points} + ${points}`,
        level: sql`FLOOR(${users.points} / 1000) + 1`
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserWithProgress(userId: number): Promise<UserWithProgress | null> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const currentLevelPoints = (user.level - 1) * 1000;
    const nextLevelPoints = user.level * 1000;
    const nextLevelProgress = user.points - currentLevelPoints;
    const pointsToNextLevel = nextLevelPoints - user.points;

    return {
      ...user,
      nextLevelProgress,
      pointsToNextLevel,
    };
  }

  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.isActive, true));
  }

  async getActiveChallenge(challengeId: number): Promise<Challenge | null> {
    const result = await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.id, challengeId), eq(challenges.isActive, true)));
    return result[0] || null;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const result = await db.insert(challenges).values(challenge).returning();
    return result[0];
  }

  async getChallengesWithSubmissions(userId: number): Promise<ChallengeWithSubmissions[]> {
    const allChallenges = await this.getChallenges();
    const userSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId));

    return allChallenges.map(challenge => {
      const userSubmission = userSubmissions.find(s => s.challengeId === challenge.id);
      return {
        ...challenge,
        userSubmission,
        hasSubmitted: !!userSubmission,
      };
    });
  }

  async incrementChallengeParticipants(challengeId: number): Promise<void> {
    await db
      .update(challenges)
      .set({ participants: sql`${challenges.participants} + 1` })
      .where(eq(challenges.id, challengeId));
  }

  async incrementChallengeSubmissions(challengeId: number): Promise<void> {
    await db
      .update(challenges)
      .set({ submissions: sql`${challenges.submissions} + 1` })
      .where(eq(challenges.id, challengeId));
  }

  async getSubmission(id: number): Promise<Submission | null> {
    const result = await db.select().from(submissions).where(eq(submissions.id, id));
    return result[0] || null;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const result = await db.insert(submissions).values(submission).returning();
    await this.incrementChallengeSubmissions(submission.challengeId);
    return result[0];
  }

  async getUserSubmissions(userId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt));
  }

  async approveSubmission(submissionId: number, points: number): Promise<Submission> {
    const result = await db
      .update(submissions)
      .set({ isApproved: true, points })
      .where(eq(submissions.id, submissionId))
      .returning();

    const submission = result[0];
    if (submission) {
      await this.updateUserPoints(submission.userId, points);
    }

    return submission;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.createdAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const result = await db.insert(achievements).values(achievement).returning();
    await this.updateUserPoints(achievement.userId, achievement.points);
    return result[0];
  }

  async getUserStats(userId: number, week?: string): Promise<UserStats | null> {
    const currentWeek = week || this.getCurrentWeek();
    const result = await db
      .select()
      .from(userStats)
      .where(and(eq(userStats.userId, userId), eq(userStats.week, currentWeek)));
    return result[0] || null;
  }

  async updateUserStats(stats: InsertUserStats): Promise<UserStats> {
    const existing = await this.getUserStats(stats.userId, stats.week);
    
    if (existing) {
      const result = await db
        .update(userStats)
        .set({
          photosSubmitted: existing.photosSubmitted + (stats.photosSubmitted || 0),
          challengesJoined: existing.challengesJoined + (stats.challengesJoined || 0),
          pointsEarned: existing.pointsEarned + (stats.pointsEarned || 0),
          rankChange: stats.rankChange || existing.rankChange,
        })
        .where(and(eq(userStats.userId, stats.userId), eq(userStats.week, stats.week)))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userStats).values(stats).returning();
      return result[0];
    }
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const topUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);

    return topUsers.map((user, index) => ({
      rank: index + 1,
      user,
    }));
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return `${now.getFullYear()}-${week.toString().padStart(2, '0')}`;
  }
}

export const storage = new MemStorage();
