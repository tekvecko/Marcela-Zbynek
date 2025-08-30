import {
  users, questChallenges, uploadedPhotos, photoLikes, photoComments, questProgress, authSessions,
  userBehaviorLogs, aiLearningInsights, userAchievements, userStreaks, userLevels,
  type User, type InsertUser, type UpsertUser,
  type QuestChallenge, type InsertQuestChallenge,
  type UploadedPhoto, type InsertUploadedPhoto,
  type PhotoLike, type InsertPhotoLike,
  type PhotoComment, type InsertPhotoComment,
  type QuestProgress, type InsertQuestProgress,
  type AuthUser, type InsertAuthUser, type AuthSession, type InsertAuthSession,
  type UserBehaviorLog, type InsertUserBehaviorLog,
  type AiLearningInsight, type InsertAiLearningInsight
} from "@shared/schema";
import { db, dbName } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from 'bcryptjs';

// Placeholder for schema definitions that might be missing in the provided snippet
// In a real scenario, these would be properly imported from "@shared/schema"
declare module "@shared/schema" {
  interface User {
    // Existing User properties
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    passwordHash: string | null;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  interface QuestChallenge {
    id: string;
    title: string;
    description: string;
    targetPhotos: number;
    points: number;
    isActive: boolean;
    createdAt: Date;
    isUnlocked?: boolean; // Added for unlock status
    unlockRequirement?: string; // Added for unlock requirement description
  }
  interface UserBehaviorLog {
    id: string;
    userEmail: string;
    actionType: string;
    details?: string | null;
    pointsEarned?: number | null;
    createdAt: Date;
  }
  interface AiLearningInsight {
    id: string;
    type: string; // e.g., 'photo_analysis', 'user_behavior'
    content: string;
    lastUpdated: Date;
    insightType: string; // Added to match the schema usage in getAiInsights
  }
  interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: Date;
    progress: number;
  }
  interface UserStreak {
    id: string;
    userId: string;
    streakType: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
  }
  interface UserLevel {
    id: string;
    userId: string;
    level: number;
    experience: number;
    title: string;
    updatedAt: Date;
  }
  interface MiniGameScore {
    id: string;
    playerEmail: string;
    score: number;
    createdAt: Date;
  }
}

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  // Legacy methods for compatibility
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getQuestChallenges(): Promise<QuestChallenge[]>;
  getQuestChallenge(id: string): Promise<QuestChallenge | undefined>;
  createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge>;
  updateQuestChallenge(id: string, challenge: InsertQuestChallenge): Promise<QuestChallenge | undefined>;
  deleteQuestChallenge(id: string): Promise<boolean>;

  getUploadedPhotos(): Promise<UploadedPhoto[]>;
  getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined>;
  getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]>;
  createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto>;
  updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined>;
  updatePhotoVerification(id: string, isVerified: boolean): Promise<UploadedPhoto | undefined>;
  deleteUploadedPhoto(id: string): Promise<boolean>;

  getPhotoLikes(photoId: string): Promise<PhotoLike[]>;
  createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike>;
  hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean>;
  cleanupAnonymousLikes(photoId: string): Promise<void>;
  removePhotoLike(photoId: string, voterName: string): Promise<boolean>;
  togglePhotoLike(photoId: string, voterName: string): Promise<{
    userHasLiked: boolean;
    likes: number;
    action: 'liked' | 'unliked';
  }>;

  // Photo comments
  getPhotoComments(photoId: string): Promise<PhotoComment[]>;
  addPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment>;

  getQuestProgress(): Promise<QuestProgress[]>;
  getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]>;
  createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress>;
  updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined>;
  getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress>;
  getUnlockedChallenges(participantName: string): Promise<QuestChallenge[]>;

  // Auth operations
  createAuthUser(userData: InsertAuthUser): Promise<AuthUser>;
  getAuthUserByEmail(email: string): Promise<AuthUser | undefined>;
  getAuthUserById(id: string): Promise<AuthUser | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  createAuthSession(userId: string): Promise<AuthSession>;
  getAuthSessionByToken(token: string): Promise<AuthSession | undefined>;
  deleteAuthSession(sessionId: string): Promise<boolean>;

  // User behavior tracking
  logUserBehavior(behaviorData: InsertUserBehaviorLog): Promise<UserBehaviorLog>;
  getUserBehaviorLogs(filters?: { userEmail?: string; actionType?: string; limit?: number }): Promise<UserBehaviorLog[]>;

  // AI learning insights
  createAiInsight(insightData: InsertAiLearningInsight): Promise<AiLearningInsight>;
  getAiInsights(type?: string): Promise<AiLearningInsight[]>;
  updateAiInsight(id: string, updateData: Partial<InsertAiLearningInsight>): Promise<AiLearningInsight | null>;

  // Gamification methods (Achievements, Streaks, Levels, Points)
  getUserAchievements(userId: string): Promise<any[]>;
  saveUserAchievement(achievement: any): Promise<void>;
  getUserStreak(userId: string, streakType: string): Promise<any | null>;
  saveUserStreak(streak: any): Promise<void>;
  getStreakLeaderboard(streakType: string): Promise<any[]>;
  addUserPoints(userId: string, points: number): Promise<void>;
  getMiniGameScores(userId?: string): Promise<any[]>;
  getUserLevel(userId: string): Promise<any | null>;
  saveUserLevel(level: any): Promise<void>;
  updateUserLevel(level: any): Promise<void>;
  getLevelLeaderboard(): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private questChallenges: Map<string, QuestChallenge>;
  private uploadedPhotos: Map<string, UploadedPhoto>;
  private photoLikes: Map<string, PhotoLike>;
  private photoComments: Map<string, PhotoComment>;
  private questProgress: Map<string, QuestProgress>;
  private authUsers: Map<string, AuthUser>;
  private authSessions: Map<string, AuthSession>;

  // Gamification data in memory
  private userAchievements: Map<string, any>;
  private userStreaks: Map<string, any>;
  private userLevels: Map<string, any>;
  private miniGameScores: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.questChallenges = new Map();
    this.uploadedPhotos = new Map();
    this.photoLikes = new Map();
    this.photoComments = new Map();
    this.questProgress = new Map();
    this.authUsers = new Map();
    this.authSessions = new Map();

    // Initialize gamification maps
    this.userAchievements = new Map();
    this.userStreaks = new Map();
    this.userLevels = new Map();
    this.miniGameScores = new Map();
  }

  private generateDefaultChallenges(): void {
    // Initialize default quest challenges with variations
    const defaultChallenges: InsertQuestChallenge[] = [
      // Obřadní momenty - vysoké body
      {
        title: 'Okamžik "Ano" 💍',
        description: 'Zachyťte moment výměny slibů nebo "ano"',
        targetPhotos: 1,
        points: 25,
        isActive: true,
      },
      {
        title: 'První manželský polibek 💋',
        description: 'Ten magický první polibek jako manželé',
        targetPhotos: 1,
        points: 25,
        isActive: true,
      },
      {
        title: 'Výměna prstenů ✨',
        description: 'Detail snubních prstenů na rukou',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Gratulace novomanželům 🎉',
        description: 'Moment gratulací a objímání po obřadu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },

      // Rodinné a skupinové fotky
      {
        title: 'Rodinné foto nevěsty 👨‍👩‍👧‍👦',
        description: 'Rodina nevěsty pohromadě',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Rodinné foto ženicha 👨‍👩‍👧‍👦',
        description: 'Rodina ženicha pohromadě',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Skupinové foto všech hostů 📸',
        description: 'Všichni svatební hosté na jedné fotce',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Svědci v akci 🤵‍♂️👰‍♀️',
        description: 'Svědci během obřadu nebo při podpisu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },

      // Večerní zábava
      {
        title: 'První tanec 💃',
        description: 'Náš speciální první tanec jako manželé',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Tanec s rodiči 👫',
        description: 'Nevěsta s tatínkem nebo ženich s maminkou',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Zábava na parketu 🕺',
        description: 'Hosté si užívají na tanečním parketu',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Krájení dortu 🎂',
        description: 'Společné krájení svatebního dortu',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },

      // Emotivní momenty
      {
        title: 'Šťastné slzy 😭',
        description: 'Emoce a dojetí během svatby',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Smích a radost 😊',
        description: 'Upřímné momenty štěstí a smíchu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },

      // Detaily a přípravy
      {
        title: 'Svatební šaty detail 👗',
        description: 'Krásný detail svatebních šatů',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Svatební kytice 💐',
        description: 'Nevěstina kytice v plné kráse',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Svatební dort 🍰',
        description: 'Náš krásný svatební dort',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Dekorace a výzdoba 🎀',
        description: 'Svatební dekorace a výzdoba prostoru',
        targetPhotos: 1,
        points: 10,
        isActive: true,
      },
      {
        title: 'Přípravy před obřadem 💄',
        description: 'Nevěsta nebo ženich se připravují',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },

      // Zábavné a kreativní
      {
        title: 'Házen kytice 🎯',
        description: 'Házení svatební kytice svobodným',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },
      {
        title: 'Děti na svatbě 👶',
        description: 'Roztomilé momenty s dětmi hostů',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Nečekané okamžiky 😄',
        description: 'Vtipné, spontánní nebo nečekané situace',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Toast a přípitek 🥂',
        description: 'Projevy a přípitek na novomanžele',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },

      // Kreativní úhly
      {
        title: 'Černobílá klasika ⚫⚪',
        description: 'Artistic černobílá fotka z jakéhokoliv momentu',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Detail rukou 🤝',
        description: 'Krásný detail propojených rukou novomanželů',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
    ];

    defaultChallenges.forEach(challenge => {
      this.createQuestChallenge(challenge);
    });
  }

  async initialize(): Promise<void> {
    this.generateDefaultChallenges();
    await this.initializeAdminAccount();
  }

  async initializeAdminAccount(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables");
      return;
    }

    try {
      // Check if admin account already exists
      const existingAdmin = await this.getAuthUserByEmail(adminEmail);

      if (existingAdmin) {
        console.log(`✅ Admin account already exists: ${adminEmail}`);
        // Update admin status
        existingAdmin.isAdmin = true;
        return;
      }

      // Create new admin account
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const adminData: InsertAuthUser = {
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "Account",
      };

      const admin = await this.createAuthUser(adminData);
      admin.isAdmin = true;

      console.log(`✅ Created admin account: ${adminEmail}`);
    } catch (error) {
      console.error("Failed to initialize admin account:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }

    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        id: userData.id,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        passwordHash: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Legacy methods for compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username, // Using email as username for compatibility
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      passwordHash: null,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getQuestChallenges(): Promise<QuestChallenge[]> {
    // Simulace výpadku databáze
    if (process.env.SIMULATE_DB_OUTAGE === 'true') {
      console.warn('🔴 SIMULACE: Databáze nedostupná - používám záložní data');
      return [
        {
          id: 'fallback-1',
          title: '🔴 ZÁLOŽNÍ REŽIM - Základní fotka',
          description: 'Aplikace běží v záložním režimu. Nahrajte jakoukoliv fotku.',
          targetPhotos: 1,
          points: 10,
          isActive: true,
          createdAt: new Date(),

        }
      ];
    }

    try {
      const challenges = Array.from(this.questChallenges.values()).filter(c => c.isActive);
      console.log(`📊 MemStorage vrací ${challenges.length} aktivních výzev`);
      return challenges;
    } catch (error) {
      console.error('Chyba v MemStorage při získávání quest challenges:', error);
      console.warn('🔴 FALLBACK v MemStorage: Vracím všechny výzvy bez filtrování');
      // Vrátíme všechny výzvy bez filtrování jako poslední možnost
      return Array.from(this.questChallenges.values());
    }
  }


  async getQuestChallenge(id: string): Promise<QuestChallenge | undefined> {
    return this.questChallenges.get(id);
  }

  async createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge> {
    const id = randomUUID();
    const questChallenge: QuestChallenge = {
      id,
      title: challenge.title,
      description: challenge.description,
      targetPhotos: challenge.targetPhotos ?? 1,
      points: challenge.points ?? 10,
      isActive: challenge.isActive ?? true,
      createdAt: new Date(),
    };
    this.questChallenges.set(id, questChallenge);
    return questChallenge;
  }

  async updateQuestChallenge(id: string, challenge: InsertQuestChallenge): Promise<QuestChallenge | undefined> {
    const existingChallenge = this.questChallenges.get(id);
    if (existingChallenge) {
      const updatedChallenge: QuestChallenge = {
        ...existingChallenge,
        title: challenge.title,
        description: challenge.description,
        targetPhotos: challenge.targetPhotos ?? existingChallenge.targetPhotos,
        points: challenge.points ?? existingChallenge.points,
        isActive: challenge.isActive ?? existingChallenge.isActive,
      };
      this.questChallenges.set(id, updatedChallenge);
      return updatedChallenge;
    }
    return undefined;
  }

  async deleteQuestChallenge(id: string): Promise<boolean> {
    return this.questChallenges.delete(id);
  }

  async getUploadedPhotos(): Promise<UploadedPhoto[]> {
    return Array.from(this.uploadedPhotos.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined> {
    return this.uploadedPhotos.get(id);
  }

  async getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]> {
    return Array.from(this.uploadedPhotos.values())
      .filter(photo => photo.questId === questId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto> {
    const id = randomUUID();
    const uploadedPhoto: UploadedPhoto = {
      id,
      filename: photo.filename,
      originalName: photo.originalName,
      mimeType: photo.mimeType,
      size: photo.size,
      uploaderName: photo.uploaderName,
      questId: photo.questId ?? null,
      likes: 0,
      isVerified: photo.isVerified ?? false,
      verificationScore: photo.verificationScore ?? null,
      aiAnalysis: photo.aiAnalysis ?? null,
      technicalQuality: photo.technicalQuality ?? null,
      detectedObjects: photo.detectedObjects ?? null,
      weddingElements: photo.weddingElements ?? null,
      atmosphere: photo.atmosphere ?? null,
      peopleCount: photo.peopleCount ?? null,
      emotions: photo.emotions ?? null,
      category: photo.category ?? null,
      tags: photo.tags ?? null,
      creativeTips: photo.creativeTips ?? null,
      createdAt: new Date(),
    };
    this.uploadedPhotos.set(id, uploadedPhoto);
    return uploadedPhoto;
  }

  async updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined> {
    const photo = this.uploadedPhotos.get(id);
    if (photo) {
      photo.likes = likes;
      this.uploadedPhotos.set(id, photo);
      return photo;
    }
    return undefined;
  }

  async updatePhotoVerification(id: string, isVerified: boolean): Promise<UploadedPhoto | undefined> {
    const photo = this.uploadedPhotos.get(id);
    if (photo) {
      photo.isVerified = isVerified;
      this.uploadedPhotos.set(id, photo);
      return photo;
    }
    return undefined;
  }

  async deleteUploadedPhoto(id: string): Promise<boolean> {
    // Also delete related likes
    Array.from(this.photoLikes.entries()).forEach(([likeId, like]) => {
      if (like.photoId === id) {
        this.photoLikes.delete(likeId);
      }
    });
    return this.uploadedPhotos.delete(id);
  }

  async getPhotoLikes(photoId: string): Promise<PhotoLike[]> {
    return Array.from(this.photoLikes.values()).filter(like => like.photoId === photoId);
  }

  async createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike> {
    const id = randomUUID();
    const photoLike: PhotoLike = {
      ...like,
      id,
      createdAt: new Date(),
    };
    this.photoLikes.set(id, photoLike);
    return photoLike;
  }

  async hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean> {
    const result = Array.from(this.photoLikes.values()).some(
      like => like.photoId === photoId && like.voterName === voterName
    );
    console.log(`Checking if ${voterName} liked ${photoId}: ${result}`);
    return result;
  }

  async cleanupAnonymousLikes(photoId: string): Promise<void> {
    // Remove old anonymous likes for this photo
    Array.from(this.photoLikes.entries()).forEach(([likeId, like]) => {
      if (like.photoId === photoId && like.voterName === "anonymous") {
        this.photoLikes.delete(likeId);
        console.log(`Cleaned up anonymous like for photo ${photoId}`);
      }
    });
  }

  async removePhotoLike(photoId: string, voterName: string): Promise<boolean> {
    let deleted = false;
    const entries = Array.from(this.photoLikes.entries());
    for (const [likeId, like] of entries) {
      if (like.photoId === photoId && like.voterName === voterName) {
        this.photoLikes.delete(likeId);
        deleted = true;
        break;
      }
    }
    return deleted;
  }

  // Thread-safe atomic like/unlike operation to prevent race conditions
  async togglePhotoLike(photoId: string, voterName: string): Promise<{
    userHasLiked: boolean;
    likes: number;
    action: 'liked' | 'unliked';
  }> {
    // Get current photo
    const photo = this.uploadedPhotos.get(photoId);
    if (!photo) {
      throw new Error('Fotka nebyla nalezena');
    }

    // Check current like status
    const hasLiked = Array.from(this.photoLikes.values()).some(
      like => like.photoId === photoId && like.voterName === voterName
    );

    if (hasLiked) {
      // Remove like
      const entries = Array.from(this.photoLikes.entries());
      for (const [likeId, like] of entries) {
        if (like.photoId === photoId && like.voterName === voterName) {
          this.photoLikes.delete(likeId);
          break;
        }
      }

      // Update photo likes count atomically
      const newLikeCount = Math.max(0, photo.likes - 1);
      photo.likes = newLikeCount;
      this.uploadedPhotos.set(photoId, photo);

      return {
        userHasLiked: false,
        likes: newLikeCount,
        action: 'unliked'
      };
    } else {
      // Add like
      const likeId = randomUUID();
      const newLike: PhotoLike = {
        id: likeId,
        photoId,
        voterName,
        createdAt: new Date(),
      };
      this.photoLikes.set(likeId, newLike);

      // Update photo likes count atomically
      const newLikeCount = photo.likes + 1;
      photo.likes = newLikeCount;
      this.uploadedPhotos.set(photoId, photo);

      return {
        userHasLiked: true,
        likes: newLikeCount,
        action: 'liked'
      };
    }
  }

  // Photo comments operations
  async getPhotoComments(photoId: string): Promise<PhotoComment[]> {
    return Array.from(this.photoComments.values())
      .filter(comment => comment.photoId === photoId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment> {
    const id = randomUUID();
    const photoComment: PhotoComment = {
      ...comment,
      id,
      createdAt: new Date(),
    };
    this.photoComments.set(id, photoComment);
    return photoComment;
  }

  async getQuestProgress(): Promise<QuestProgress[]> {
    return Array.from(this.questProgress.values());
  }

  async getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]> {
    return Array.from(this.questProgress.values()).filter(
      progress => progress.participantName === participantName
    );
  }

  async createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress> {
    const id = randomUUID();
    const questProgressRecord: QuestProgress = {
      id,
      questId: progress.questId,
      participantName: progress.participantName,
      photosUploaded: progress.photosUploaded ?? 0,
      isCompleted: progress.isCompleted ?? false,
      completedAt: null,
      createdAt: new Date(),
    };
    this.questProgress.set(id, questProgressRecord);
    return questProgressRecord;
  }

  async updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined> {
    const progress = this.questProgress.get(id);
    if (progress) {
      progress.photosUploaded = photosUploaded;
      if (isCompleted !== undefined) {
        progress.isCompleted = isCompleted;
        progress.completedAt = isCompleted ? new Date() : null;
      }
      this.questProgress.set(id, progress);
      return progress;
    }
    return undefined;
  }

  async getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress> {
    const existing = Array.from(this.questProgress.values()).find(
      progress => progress.questId === questId && progress.participantName === participantName
    );

    if (existing) {
      return existing;
    }

    return this.createQuestProgress({
      questId,
      participantName,
      photosUploaded: 0,
      isCompleted: false,
    });
  }

  async getUnlockedChallenges(participantName: string): Promise<QuestChallenge[]> {
    // Time-based unlocking system
    const allChallenges = Array.from(this.questChallenges.values());
    const currentTime = new Date();

    // Sort challenges by unlock order first, then by creation date
    const sortedChallenges = allChallenges.sort((a, b) => {
      if (a.unlockOrder !== b.unlockOrder) {
        return a.unlockOrder - b.unlockOrder;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedChallenges.map((challenge, index) => {
      let isUnlocked = false;
      let unlockRequirement = '';

      // If challenge has an unlock date, check against current time
      if (challenge.unlockDate) {
        const unlockTime = new Date(challenge.unlockDate);
        isUnlocked = currentTime >= unlockTime;

        if (!isUnlocked) {
          const timeUntilUnlock = unlockTime.getTime() - currentTime.getTime();
          const daysUntil = Math.ceil(timeUntilUnlock / (1000 * 60 * 60 * 24));
          const hoursUntil = Math.ceil(timeUntilUnlock / (1000 * 60 * 60));

          if (daysUntil > 1) {
            unlockRequirement = `Odemkne se za ${daysUntil} dní`;
          } else if (hoursUntil > 1) {
            unlockRequirement = `Odemkne se za ${hoursUntil} hodin`;
          } else {
            unlockRequirement = 'Odemkne se brzy';
          }
        }
      } else {
        // Fallback: first 3 challenges are always unlocked, others unlock progressively
        isUnlocked = index < 3;
        if (!isUnlocked) {
          unlockRequirement = 'Čeká na harmonogram odemčení';
        }
      }

      return { ...challenge, isUnlocked, unlockRequirement };
    });
  }

  // Auth methods
  async createAuthUser(userData: InsertAuthUser): Promise<AuthUser> {
    const id = randomUUID();
    // Password is already hashed in the registration route, so don't hash it again
    const passwordHash = userData.passwordHash ?? null;

    const authUser: AuthUser = {
      id,
      email: userData.email ?? null,
      passwordHash,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.authUsers.set(id, authUser);
    return authUser;
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
    return Array.from(this.authUsers.values()).find(user => user.email === email);
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    return this.authUsers.get(id);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createAuthSession(userId: string): Promise<AuthSession> {
    const id = randomUUID();
    const sessionToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const session: AuthSession = {
      id,
      userId,
      sessionToken,
      expiresAt,
      createdAt: new Date(),
    };

    this.authSessions.set(id, session);
    return session;
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    return Array.from(this.authSessions.values()).find(session =>
      session.sessionToken === token && session.expiresAt > new Date()
    );
  }

  async deleteAuthSession(sessionId: string): Promise<boolean> {
    return this.authSessions.delete(sessionId);
  }

  // User behavior tracking
  async logUserBehavior(behaviorData: InsertUserBehaviorLog): Promise<UserBehaviorLog> {
    const id = randomUUID();
    const log: UserBehaviorLog = {
      ...behaviorData,
      id,
      createdAt: new Date(),
    };
    // For MemStorage, we don't have a persistent log, but we can simulate it or just return the created log.
    // In a real scenario, this would write to a log file or a dedicated logging service.
    console.log("MemStorage: Logging user behavior:", log);
    return log;
  }

  async getUserBehaviorLogs(filters?: { userEmail?: string; actionType?: string; limit?: number }): Promise<UserBehaviorLog[]> {
    // In-memory storage doesn't persist logs, so this would return an empty array or simulated data.
    // For demonstration, returning an empty array.
    console.log("MemStorage: Fetching user behavior logs with filters:", filters);
    return [];
  }

  // AI learning insights
  async createAiInsight(insightData: InsertAiLearningInsight): Promise<AiLearningInsight> {
    const id = randomUUID();
    const insight: AiLearningInsight = {
      ...insightData,
      id,
      lastUpdated: new Date(),
    };
    // In-memory storage, so we don't have a persistent store for insights.
    console.log("MemStorage: Creating AI insight:", insight);
    return insight;
  }

  async getAiInsights(type?: string): Promise<AiLearningInsight[]> {
    // In-memory storage doesn't persist insights.
    console.log("MemStorage: Fetching AI insights with type:", type);
    return [];
  }

  async updateAiInsight(id: string, updateData: Partial<InsertAiLearningInsight>): Promise<AiLearningInsight | null> {
    // In-memory storage doesn't persist insights.
    console.log("MemStorage: Updating AI insight with id:", id, "and data:", updateData);
    return null;
  }

  // Gamification methods (Achievements, Streaks, Levels, Points)
  async getUserAchievements(userId: string): Promise<any[]> {
    return Array.from(this.userAchievements.values()).filter(ach => ach.userId === userId);
  }

  async saveUserAchievement(achievement: any): Promise<void> {
    const id = randomUUID();
    this.userAchievements.set(id, { ...achievement, id });
  }

  async getUserStreak(userId: string, streakType: string): Promise<any | null> {
    for (const streak of this.userStreaks.values()) {
      if (streak.userId === userId && streak.streakType === streakType) {
        return streak;
      }
    }
    return null;
  }

  async saveUserStreak(streak: any): Promise<void> {
    const existing = await this.getUserStreak(streak.userId, streak.streakType);
    if (existing) {
      Object.assign(existing, streak); // Update existing
    } else {
      const id = randomUUID();
      this.userStreaks.set(id, { ...streak, id });
    }
  }

  async getStreakLeaderboard(streakType: string): Promise<any[]> {
    return Array.from(this.userStreaks.values())
      .filter(streak => streak.streakType === streakType)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 20);
  }

  async addUserPoints(userId: string, points: number): Promise<void> {
    // In MemStorage, we can just log the behavior
    await this.logUserBehavior({
      userEmail: userId,
      actionType: 'points_awarded',
      details: `Přidáno ${points} bodů`,
      pointsEarned: points
    });
  }

  async getMiniGameScores(userId?: string): Promise<any[]> {
    const scores = Array.from(this.miniGameScores.values());
    if (userId) {
      return scores.filter(score => score.playerEmail === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return scores.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserLevel(userId: string): Promise<any | null> {
    return this.userLevels.get(userId) || null;
  }

  async saveUserLevel(level: any): Promise<void> {
    this.userLevels.set(level.userId, level);
  }

  async updateUserLevel(level: any): Promise<void> {
    this.userLevels.set(level.userId, level); // Overwrite or update
  }

  async getLevelLeaderboard(): Promise<any[]> {
    return Array.from(this.userLevels.values())
      .sort((a, b) => {
        if (b.level !== a.level) {
          return b.level - a.level;
        }
        return b.experience - a.experience;
      })
      .slice(0, 20);
  }

  // Helper to initialize memory storage if needed (e.g., for fallback)
  initializeMemoryStorage(): void {
    if (this.users.size === 0 && this.questChallenges.size === 0) {
      this.initialize();
    }
  }
}

export class DatabaseStorage implements IStorage {
  private memoryFallback: MemStorage | null = null;

  constructor() {
    // Pokud není databáze dostupná, použij memory storage
    if (!db) {
      console.log(`🔄 Používám in-memory storage místo databáze (${dbName})`);
      this.memoryFallback = new MemStorage();
    } else {
      console.log(`✅ Úspěšně připojen k databázi: ${dbName}`);
    }
  }

  async initialize(): Promise<void> {
    console.log("🔄 Initializing database...");

    if (!db) {
      console.log("⚠️ Database not available, using in-memory storage");
      this.memoryFallback = new MemStorage();
      await this.memoryFallback.initialize();
      return;
    }

    try {
      console.log("✅ Database initialization completed successfully");

      // Initialize admin account from environment variables
      await this.initializeAdminAccount();
    } catch (error) {
      console.error("Database initialization failed:", error);
      console.log("⚠️ Switching to in-memory storage");
      this.memoryFallback = new MemStorage();
      await this.memoryFallback.initialize();
    }
  }

  async initializeAdminAccount(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables");
      return;
    }

    try {
      // Check if admin account already exists
      const existingAdmin = await this.getAuthUserByEmail(adminEmail);

      if (existingAdmin) {
        console.log(`✅ Admin account already exists: ${adminEmail}`);

        // Update admin status if not already set
        if (!existingAdmin.isAdmin) {
          if (db) {
            await db.update(users)
              .set({ isAdmin: true })
              .where(eq(users.email, adminEmail));
            console.log(`✅ Updated admin status for: ${adminEmail}`);
          }
        }
        return;
      }

      // Create new admin account
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const adminData: InsertAuthUser = {
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "Account",
      };

      const admin = await this.createAuthUser(adminData);

      // Set admin status
      if (db) {
        await db.update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, admin.id));
      }

      console.log(`✅ Created admin account: ${adminEmail}`);
    } catch (error) {
      console.error("Failed to initialize admin account:", error);
    }
  }

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    if (this.memoryFallback) {
      return this.memoryFallback.getUser(id);
    }

    try {
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user || undefined;
    } catch (error) {
      console.error("Failed to get user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user || undefined;
    } catch (error) {
      console.error("Failed to get user by email:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }

    if (this.memoryFallback) {
      return this.memoryFallback.upsertUser(userData);
    }

    if (!db) throw new Error("Database not available");

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
        },
      })
      .returning();
    return user;
  }

  // Legacy methods for compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Quest Challenge operations
  async getQuestChallenges(): Promise<QuestChallenge[]> {
    // Simulace výpadku databáze
    if (process.env.SIMULATE_DB_OUTAGE === 'true') {
      console.warn('🔴 SIMULACE: Databáze nedostupná - používám záložní data');
      return [
        {
          id: 'fallback-1',
          title: '🔴 ZÁLOŽNÍ REŽIM - Základní fotka',
          description: 'Aplikace běží v záložním režimu. Nahrajte jakoukoliv fotku.',
          targetPhotos: 1,
          points: 10,
          isActive: true,
          createdAt: new Date(),

        }
      ];
    }

    try {
      if (!db) throw new Error("Database not available");
      const challenges = await db.select().from(questChallenges);
      console.log(`📊 Database vrací ${challenges.length} výzev`);

      // If no challenges exist, initialize with defaults
      if (challenges.length === 0) {
        console.log('🔄 Žádné výzvy v DB, inicializuji výchozí...');
        await this.initializeDefaultChallenges();
        return await db.select().from(questChallenges);
      }

      return challenges;
    } catch (error) {
      console.error('Databázová chyba:', error);
      console.warn('🔴 AUTOMATICKÝ FALLBACK: Přepínám na MemStorage');

      // Fallback na MemStorage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
        this.memoryFallback.initializeMemoryStorage();
      }
      return this.memoryFallback.getQuestChallenges();
    }
  }

  async getQuestChallenge(id: string): Promise<QuestChallenge | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [challenge] = await db.select().from(questChallenges).where(eq(questChallenges.id, id));
      return challenge;
    } catch (error) {
      console.error(`Database getQuestChallenge failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
        this.memoryFallback.initializeMemoryStorage();
      }
      return this.memoryFallback.getQuestChallenge(id);
    }
  }

  async createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge> {
    try {
      if (!db) throw new Error("Database not available");
      const [createdChallenge] = await db.insert(questChallenges).values(challenge).returning();
      return createdChallenge;
    } catch (error) {
      console.error('Failed to create quest challenge:', error);
      throw error; // Re-throw to indicate failure
    }
  }

  async updateQuestChallenge(id: string, challenge: InsertQuestChallenge): Promise<QuestChallenge | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [updatedChallenge] = await db
        .update(questChallenges)
        .set(challenge)
        .where(eq(questChallenges.id, id))
        .returning();
      return updatedChallenge;
    } catch (error) {
      console.error(`Failed to update quest challenge ${id}:`, error);
      return undefined;
    }
  }

  async deleteQuestChallenge(id: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not available");
      const result = await db.delete(questChallenges).where(eq(questChallenges.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Failed to delete quest challenge ${id}:`, error);
      return false;
    }
  }

  private async initializeDefaultChallenges(): Promise<void> {
    const defaultChallenges: InsertQuestChallenge[] = [
      // Klíčové momenty
      {
        title: 'První tanec 💃',
        description: 'Náš speciální první tanec jako manželé',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Svatební kytice 💐',
        description: 'Nevěstina kytice v plné kráse',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Svatební dort 🍰',
        description: 'Náš krásný svatební dort',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Krájení dortu 🎂',
        description: 'Společné krájení svatebního dortu',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },
      {
        title: 'Výměna prstenů ✨',
        description: 'Detail snubních prstenů na rukou',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'První manželský polibek 💋',
        description: 'Ten magický první polibek jako manželé',
        targetPhotos: 1,
        points: 25,
        isActive: true,
      },
      {
        title: 'Okamžik "Ano" 💍',
        description: 'Zachyťte moment výměny slibů nebo "ano"',
        targetPhotos: 1,
        points: 25,
        isActive: true,
      },
      {
        title: 'Házen kytice 🎯',
        description: 'Házení svatební kytice svobodným',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },
      {
        title: 'Skupinové foto všech hostů 📸',
        description: 'Všichni svatební hosté na jedné fotce',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Šťastné slzy 😭',
        description: 'Emoce a dojetí během svatby',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Černobílá klasika ⚫⚪',
        description: 'Artistic černobílá fotka z jakéhokoliv momentu',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Smích a radost 😊',
        description: 'Upřímné momenty štěstí a smíchu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Rodinné foto nevěsty 👨‍👩‍👧‍👦',
        description: 'Rodina nevěsty pohromadě',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Rodinné foto ženicha 👨‍👩‍👧‍👦',
        description: 'Rodina ženicha pohromadě',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Svatební šaty detail 👗',
        description: 'Krásný detail svatebních šatů',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Tanec s rodiči 👫',
        description: 'Nevěsta s tatínkem nebo ženich s maminkou',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Detail rukou 🤝',
        description: 'Krásný detail propojených rukou novomanželů',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Nečekané okamžiky 😄',
        description: 'Vtipné, spontánní nebo nečekané situace',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Přípravy před obřadem 💄',
        description: 'Nevěsta nebo ženich se připravují',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Svědci v akci 🤵‍♂️👰‍♀️',
        description: 'Svědci během obřadu nebo při podpisu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Gratulace novomanželům 🎉',
        description: 'Moment gratulací a objímání po obřadu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Zábava na parketu 🕺',
        description: 'Hosté si užívají na tanečním parketu',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Toast a přípitek 🥂',
        description: 'Projevy a přípitek na novomanžele',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Děti na svatbě 👶',
        description: 'Roztomilé momenty s dětmi hostů',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Dekorace a výzdoba 🎀',
        description: 'Svatební dekorace a výzdoba prostoru',
        targetPhotos: 1,
        points: 10,
        isActive: true,
      }
    ];

    if (!db) throw new Error("Database not available");

    for (const challenge of defaultChallenges) {
      await this.createQuestChallenge(challenge);
    }
  }

  // Photo operations
  async getUploadedPhotos(): Promise<UploadedPhoto[]> {
    try {
      if (!db) throw new Error("Database not available");
      const photos = await db.select().from(uploadedPhotos).orderBy(desc(uploadedPhotos.createdAt));
      return photos;
    } catch (error) {
      console.error("Failed to get uploaded photos:", error);
      return [];
    }
  }

  async getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [photo] = await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.id, id)).limit(1);
      return photo;
    } catch (error) {
      console.error("Failed to get uploaded photo:", error);
      return undefined;
    }
  }

  async getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]> {
    try {
      if (!db) throw new Error("Database not available");
      const photos = await db.select().from(uploadedPhotos)
        .where(eq(uploadedPhotos.questId, questId))
        .orderBy(desc(uploadedPhotos.createdAt));
      return photos;
    } catch (error) {
      console.error("Failed to get photos by quest ID:", error);
      return [];
    }
  }

  async createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto> {
    try {
      if (!db) throw new Error("Database not available");
      const [createdPhoto] = await db.insert(uploadedPhotos).values(photo).returning();
      return createdPhoto;
    } catch (error) {
      console.error("Failed to create uploaded photo:", error);
      throw error;
    }
  }

  async updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [updatedPhoto] = await db
        .update(uploadedPhotos)
        .set({ likes })
        .where(eq(uploadedPhotos.id, id))
        .returning();
      return updatedPhoto;
    } catch (error) {
      console.error("Failed to update photo likes:", error);
      return undefined;
    }
  }

  async updatePhotoVerification(id: string, isVerified: boolean): Promise<UploadedPhoto | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [updatedPhoto] = await db
        .update(uploadedPhotos)
        .set({ isVerified })
        .where(eq(uploadedPhotos.id, id))
        .returning();
      return updatedPhoto;
    } catch (error) {
      console.error("Failed to update photo verification:", error);
      return undefined;
    }
  }

  async deleteUploadedPhoto(id: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not available");
      // Delete related likes first
      await db.delete(photoLikes).where(eq(photoLikes.photoId, id));
      const result = await db.delete(uploadedPhotos).where(eq(uploadedPhotos.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Failed to delete uploaded photo:", error);
      return false;
    }
  }

  async getPhotoLikes(photoId: string): Promise<PhotoLike[]> {
    try {
      if (!db) throw new Error("Database not available");
      const likes = await db.select().from(photoLikes).where(eq(photoLikes.photoId, photoId));
      return likes;
    } catch (error) {
      console.error("Failed to get photo likes:", error);
      return [];
    }
  }

  async createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike> {
    try {
      if (!db) throw new Error("Database not available");
      const [createdLike] = await db.insert(photoLikes).values(like).returning();
      return createdLike;
    } catch (error) {
      console.error("Failed to create photo like:", error);
      throw error;
    }
  }

  async hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not available");
      const [like] = await db.select().from(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)))
        .limit(1);
      return !!like;
    } catch (error) {
      console.error("Failed to check if user liked photo:", error);
      return false;
    }
  }

  async cleanupAnonymousLikes(photoId: string): Promise<void> {
    try {
      if (!db) throw new Error("Database not available");
      await db.delete(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, "anonymous")));
    } catch (error) {
      console.error("Failed to cleanup anonymous likes:", error);
    }
  }

  async removePhotoLike(photoId: string, voterName: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not available");
      const result = await db.delete(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Failed to remove photo like:", error);
      return false;
    }
  }

  async togglePhotoLike(photoId: string, voterName: string): Promise<{
    userHasLiked: boolean;
    likes: number;
    action: 'liked' | 'unliked';
  }> {
    try {
      if (!db) throw new Error("Database not available");

      // Use transaction for atomic operation
      const result = await db.transaction(async (tx) => {
        // Check if user has already liked
        const [existingLike] = await tx.select().from(photoLikes)
          .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)))
          .limit(1);

        if (existingLike) {
          // Remove like
          await tx.delete(photoLikes)
            .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)));

          // Update photo likes count
          const [updatedPhoto] = await tx
            .update(uploadedPhotos)
            .set({ likes: sql`${uploadedPhotos.likes} - 1` })
            .where(eq(uploadedPhotos.id, photoId))
            .returning({ likes: uploadedPhotos.likes });

          return {
            userHasLiked: false,
            likes: updatedPhoto.likes,
            action: 'unliked' as const
          };
        } else {
          // Add like
          await tx.insert(photoLikes).values({
            photoId,
            voterName,
          });

          // Update photo likes count
          const [updatedPhoto] = await tx
            .update(uploadedPhotos)
            .set({ likes: sql`${uploadedPhotos.likes} + 1` })
            .where(eq(uploadedPhotos.id, photoId))
            .returning({ likes: uploadedPhotos.likes });

          return {
            userHasLiked: true,
            likes: updatedPhoto.likes,
            action: 'liked' as const
          };
        }
      });

      return result;
    } catch (error) {
      console.error("Failed to toggle photo like:", error);
      throw new Error('Nepodařilo se aktualizovat hodnocení fotky');
    }
  }

  // Photo comments operations
  async getPhotoComments(photoId: string): Promise<PhotoComment[]> {
    try {
      if (!db) throw new Error("Database not available");
      const comments = await db.select().from(photoComments)
        .where(eq(photoComments.photoId, photoId))
        .orderBy(desc(photoComments.createdAt));
      return comments;
    } catch (error) {
      console.error("Failed to get photo comments:", error);
      return [];
    }
  }

  async addPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment> {
    try {
      if (!db) throw new Error("Database not available");
      const [createdComment] = await db.insert(photoComments).values({
        ...comment,
        id: randomUUID(),
        createdAt: new Date(),
      }).returning();
      return createdComment;
    } catch (error) {
      console.error("Failed to add photo comment:", error);
      throw error;
    }
  }

  async getQuestProgress(): Promise<QuestProgress[]> {
    try {
      if (!db) throw new Error("Database not available");
      const progress = await db.select().from(questProgress);
      return progress;
    } catch (error) {
      console.error("Failed to get quest progress:", error);
      return [];
    }
  }

  async getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]> {
    try {
      if (!db) throw new Error("Database not available");
      const progress = await db.select().from(questProgress)
        .where(eq(questProgress.participantName, participantName));
      return progress;
    } catch (error) {
      console.error("Failed to get quest progress by participant:", error);
      return [];
    }
  }

  async createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress> {
    try {
      if (!db) throw new Error("Database not available");
      const [createdProgress] = await db.insert(questProgress).values(progress).returning();
      return createdProgress;
    } catch (error) {
      console.error("Failed to create quest progress:", error);
      throw error;
    }
  }

  async updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const updateData: any = { photosUploaded };
      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted;
        updateData.completedAt = isCompleted ? new Date() : null;
      }

      const [updatedProgress] = await db
        .update(questProgress)
        .set(updateData)
        .where(eq(questProgress.id, id))
        .returning();
      return updatedProgress;
    } catch (error) {
      console.error("Failed to update quest progress:", error);
      return undefined;
    }
  }

  async getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress> {
    try {
      if (!db) throw new Error("Database not available");

      const [existing] = await db.select().from(questProgress)
        .where(and(eq(questProgress.questId, questId), eq(questProgress.participantName, participantName)))
        .limit(1);

      if (existing) {
        return existing;
      }

      return this.createQuestProgress({
        questId,
        participantName,
        photosUploaded: 0,
        isCompleted: false,
      });
    } catch (error) {
      console.error("Failed to get or create quest progress:", error);
      throw error;
    }
  }

  async getUnlockedChallenges(participantName: string): Promise<QuestChallenge[]> {
    try {
      if (!db) throw new Error("Database not available");

      // Get all challenges and user progress
      const allChallenges = await db.select().from(questChallenges);
      const userProgress = await this.getQuestProgressByParticipant(participantName);
      const completedChallengesCount = userProgress.filter(p => p.isCompleted).length;

      return allChallenges.map((challenge, index) => {
        let isUnlocked = false;
        let unlockRequirement = '';

        if (index < 3) {
          isUnlocked = true;
        } else {
          const requiredCompleted = Math.floor(index / 2);
          if (completedChallengesCount >= requiredCompleted) {
            isUnlocked = true;
          } else {
            unlockRequirement = `Splňte ${requiredCompleted} výzev pro odemčení`;
          }
        }
        return { ...challenge, isUnlocked, unlockRequirement };
      });
    } catch (error) {
      console.error("Failed to get unlocked challenges:", error);
      return [];
    }
  }

  // Auth operations
  async createAuthUser(userData: InsertAuthUser): Promise<AuthUser> {
    try {
      if (!db) throw new Error("Database not available");
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Failed to create auth user:", error);
      throw error;
    }
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user;
    } catch (error) {
      console.error("Failed to get auth user by email:", error);
      return undefined;
    }
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user;
    } catch (error) {
      console.error("Failed to get auth user by id:", error);
      return undefined;
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createAuthSession(userId: string): Promise<AuthSession> {
    try {
      if (!db) throw new Error("Database not available");
      const sessionToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const sessionData = {
        userId,
        sessionToken,
        expiresAt,
      };

      const [session] = await db.insert(authSessions).values(sessionData).returning();
      return session;
    } catch (error) {
      console.error("Failed to create auth session:", error);
      throw error;
    }
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    try {
      if (!db) throw new Error("Database not available");
      const [session] = await db.select().from(authSessions)
        .where(and(eq(authSessions.sessionToken, token), sql`${authSessions.expiresAt} > NOW()`))
        .limit(1);
      return session;
    } catch (error) {
      console.error("Failed to get auth session by token:", error);
      return undefined;
    }
  }

  async deleteAuthSession(sessionId: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not available");
      const result = await db.delete(authSessions).where(eq(authSessions.id, sessionId));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Failed to delete auth session:", error);
      return false;
    }
  }

  // User behavior tracking
  async logUserBehavior(behaviorData: InsertUserBehaviorLog): Promise<UserBehaviorLog> {
    try {
      if (!db) throw new Error("Database not available");
      const [log] = await db.insert(userBehaviorLogs).values(behaviorData).returning();
      return log;
    } catch (error) {
      console.error("Failed to log user behavior:", error);
      throw error;
    }
  }

  async getUserBehaviorLogs(filters?: { userEmail?: string; actionType?: string; limit?: number }): Promise<UserBehaviorLog[]> {
    try {
      if (!db) throw new Error("Database not available");
      let query = db.select().from(userBehaviorLogs);

      if (filters?.userEmail) {
        query = query.where(eq(userBehaviorLogs.userEmail, filters.userEmail));
      }
      if (filters?.actionType) {
        query = query.where(eq(userBehaviorLogs.actionType, filters.actionType));
      }

      query = query.orderBy(desc(userBehaviorLogs.createdAt));

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const logs = await query;
      return logs;
    } catch (error) {
      console.error("Failed to get user behavior logs:", error);
      return [];
    }
  }

  // AI learning insights
  async createAiInsight(insightData: InsertAiLearningInsight): Promise<AiLearningInsight> {
    try {
      if (!db) throw new Error("Database not available");
      const [insight] = await db.insert(aiLearningInsights).values(insightData).returning();
      return insight;
    } catch (error) {
      console.error("Failed to create AI insight:", error);
      throw error;
    }
  }

  async getAiInsights(type?: string): Promise<AiLearningInsight[]> {
    try {
      if (!db) throw new Error("Database not available");
      let query = db.select().from(aiLearningInsights);

      if (type) {
        query = query.where(eq(aiLearningInsights.type, type));
      }

      const insights = await query.orderBy(desc(aiLearningInsights.lastUpdated));
      return insights;
    } catch (error) {
      console.error("Failed to get AI insights:", error);
      return [];
    }
  }

  async updateAiInsight(id: string, updateData: Partial<InsertAiLearningInsight>): Promise<AiLearningInsight | null> {
    try {
      if (!db) throw new Error("Database not available");
      const [updatedInsight] = await db
        .update(aiLearningInsights)
        .set({ ...updateData, lastUpdated: new Date() })
        .where(eq(aiLearningInsights.id, id))
        .returning();
      return updatedInsight || null;
    } catch (error) {
      console.error("Failed to update AI insight:", error);
      return null;
    }
  }

  // Gamification methods (Achievements, Streaks, Levels, Points)
  async getUserAchievements(userId: string): Promise<any[]> {
    try {
      if (!db) throw new Error("Database not available");
      const achievements = await db.select().from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      return achievements;
    } catch (error) {
      console.error("Failed to get user achievements:", error);
      return [];
    }
  }

  async saveUserAchievement(achievement: any): Promise<void> {
    try {
      if (!db) throw new Error("Database not available");
      await db.insert(userAchievements).values(achievement);
    } catch (error) {
      console.error("Failed to save user achievement:", error);
      throw error;
    }
  }

  async getUserStreak(userId: string, streakType: string): Promise<any | null> {
    try {
      if (!db) throw new Error("Database not available");
      const [streak] = await db.select().from(userStreaks)
        .where(and(eq(userStreaks.userId, userId), eq(userStreaks.streakType, streakType)))
        .limit(1);
      return streak || null;
    } catch (error) {
      console.error("Failed to get user streak:", error);
      return null;
    }
  }

  async saveUserStreak(streak: any): Promise<void> {
    try {
      if (!db) throw new Error("Database not available");

      const existing = await this.getUserStreak(streak.userId, streak.streakType);
      if (existing) {
        await db.update(userStreaks)
          .set(streak)
          .where(and(eq(userStreaks.userId, streak.userId), eq(userStreaks.streakType, streak.streakType)));
      } else {
        await db.insert(userStreaks).values(streak);
      }
    } catch (error) {
      console.error("Failed to save user streak:", error);
      throw error;
    }
  }

  async getStreakLeaderboard(streakType: string): Promise<any[]> {
    try {
      if (!db) throw new Error("Database not available");
      const streaks = await db.select().from(userStreaks)
        .where(eq(userStreaks.streakType, streakType))
        .orderBy(desc(userStreaks.currentStreak))
        .limit(20);
      return streaks;
    } catch (error) {
      console.error("Failed to get streak leaderboard:", error);
      return [];
    }
  }

  async addUserPoints(userId: string, points: number): Promise<void> {
    await this.logUserBehavior({
      userEmail: userId,
      actionType: 'points_awarded',
      details: `Přidáno ${points} bodů`,
      pointsEarned: points
    });
  }

  async getMiniGameScores(userId?: string): Promise<any[]> {
    // This would need a mini game scores table implementation
    console.log("DatabaseStorage: Getting mini game scores for user:", userId);
    return [];
  }

  async getUserLevel(userId: string): Promise<any | null> {
    try {
      if (!db) throw new Error("Database not available");
      const [level] = await db.select().from(userLevels)
        .where(eq(userLevels.userId, userId))
        .limit(1);
      return level || null;
    } catch (error) {
      console.error("Failed to get user level:", error);
      return null;
    }
  }

  async saveUserLevel(level: any): Promise<void> {
    try {
      if (!db) throw new Error("Database not available");

      const existing = await this.getUserLevel(level.userId);
      if (existing) {
        await db.update(userLevels)
          .set({ ...level, updatedAt: new Date() })
          .where(eq(userLevels.userId, level.userId));
      } else {
        await db.insert(userLevels).values(level);
      }
    } catch (error) {
      console.error("Failed to save user level:", error);
      throw error;
    }
  }

  async updateUserLevel(level: any): Promise<void> {
    await this.saveUserLevel(level); // Same as save for this implementation
  }

  async getLevelLeaderboard(): Promise<any[]> {
    try {
      if (!db) throw new Error("Database not available");
      const levels = await db.select().from(userLevels)
        .orderBy(desc(userLevels.level), desc(userLevels.experience))
        .limit(20);
      return levels;
    } catch (error) {
      console.error("Failed to get level leaderboard:", error);
      return [];
    }
  }

  // Helper to initialize memory storage if needed (e.g., for fallback)
  initializeMemoryStorage(): void {
    if (!this.memoryFallback) {
      this.memoryFallback = new MemStorage();
      this.memoryFallback.initialize();
    }
  }
}

// Create storage instance with fallback
let storage: IStorage;

try {
  // Try to use database storage first
  storage = new DatabaseStorage();
  storage.initialize(); // Initialize the database storage
} catch (error) {
  console.warn('Database not available, using memory storage:', error);
  storage = new MemStorage();
  // Ensure memory storage is initialized with default data if it's the primary choice from the start
  storage.initializeMemoryStorage();
}

// Export with fallback logic
export { storage };