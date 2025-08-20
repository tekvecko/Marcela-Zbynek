import {
  type User,
  type InsertUser,
  type UpsertUser,
  type QuestChallenge,
  type InsertQuestChallenge,
  type UploadedPhoto,
  type InsertUploadedPhoto,
  type PhotoLike,
  type InsertPhotoLike,
  type QuestProgress,
  type InsertQuestProgress,
  type AuthUser,
  type InsertAuthUser,
  AuthSession
} from "@shared/schema";
import { users, questChallenges, uploadedPhotos, photoLikes, questProgress, authUsers } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from 'bcryptjs';

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

  getQuestProgress(): Promise<QuestProgress[]>;
  getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]>;
  createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress>;
  updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined>;
  getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress>;

  // Auth operations
  createAuthUser(userData: InsertAuthUser): Promise<AuthUser>;
  getAuthUserByEmail(email: string): Promise<AuthUser | undefined>;
  getAuthUserById(id: string): Promise<AuthUser | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  createAuthSession(userId: string): Promise<AuthSession>;
  getAuthSessionByToken(token: string): Promise<AuthSession | undefined>;
  deleteAuthSession(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private questChallenges: Map<string, QuestChallenge>;
  private uploadedPhotos: Map<string, UploadedPhoto>;
  private photoLikes: Map<string, PhotoLike>;
  private questProgress: Map<string, QuestProgress>;
  private authUsers: Map<string, AuthUser>;
  private authSessions: Map<string, AuthSession>;


  constructor() {
    this.users = new Map();
    this.questChallenges = new Map();
    this.uploadedPhotos = new Map();
    this.photoLikes = new Map();
    this.questProgress = new Map();
    this.authUsers = new Map();
    this.authSessions = new Map();


    this.initializeDefaultData();
  }

  private initializeDefaultData() {
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
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getQuestChallenges(): Promise<QuestChallenge[]> {
    return Array.from(this.questChallenges.values()).filter(c => c.isActive);
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
    return Array.from(this.photoLikes.values()).some(
      like => like.photoId === photoId && like.voterName === voterName
    );
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

  // Auth methods
  async createAuthUser(userData: InsertAuthUser): Promise<AuthUser> {
    const id = randomUUID();
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const authUser: AuthUser = {
      id,
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isVerified: true, // Auto-verify for simplicity
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user || null;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user || null;
    } catch (error) {
      console.error("Failed to get user by email:", error);
      return null;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Legacy methods for compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Quest Challenge operations
  async getQuestChallenges(): Promise<QuestChallenge[]> {
    const challenges = await db.select().from(questChallenges);

    // If no challenges exist, initialize with defaults
    if (challenges.length === 0) {
      await this.initializeDefaultChallenges();
      return await db.select().from(questChallenges);
    }

    return challenges;
  }

  async getQuestChallenge(id: string): Promise<QuestChallenge | undefined> {
    const [challenge] = await db.select().from(questChallenges).where(eq(questChallenges.id, id));
    return challenge;
  }

  async createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge> {
    const [createdChallenge] = await db.insert(questChallenges).values(challenge).returning();
    return createdChallenge;
  }

  async updateQuestChallenge(id: string, challenge: InsertQuestChallenge): Promise<QuestChallenge | undefined> {
    const [updatedChallenge] = await db
      .update(questChallenges)
      .set(challenge)
      .where(eq(questChallenges.id, id))
      .returning();
    return updatedChallenge;
  }

  async deleteQuestChallenge(id: string): Promise<boolean> {
    const result = await db.delete(questChallenges).where(eq(questChallenges.id, id));
    return result.rowCount > 0;
  }

  private async initializeDefaultChallenges(): Promise<void> {
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

    await db.insert(questChallenges).values(defaultChallenges);
  }

  // Photo operations
  async getUploadedPhotos(): Promise<UploadedPhoto[]> {
    return await db.select().from(uploadedPhotos);
  }

  async getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined> {
    const [photo] = await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.id, id));
    return photo;
  }

  async getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]> {
    return await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.questId, questId));
  }

  async createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto> {
    const [createdPhoto] = await db.insert(uploadedPhotos).values(photo).returning();
    return createdPhoto;
  }

  async updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined> {
    const [updatedPhoto] = await db
      .update(uploadedPhotos)
      .set({ likes })
      .where(eq(uploadedPhotos.id, id))
      .returning();
    return updatedPhoto;
  }

  async updatePhotoVerification(id: string, isVerified: boolean): Promise<UploadedPhoto | undefined> {
    const [updatedPhoto] = await db
      .update(uploadedPhotos)
      .set({ isVerified })
      .where(eq(uploadedPhotos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deleteUploadedPhoto(id: string): Promise<boolean> {
    // Delete associated likes first
    await db.delete(photoLikes).where(eq(photoLikes.photoId, id));

    // Delete the photo
    const result = await db.delete(uploadedPhotos).where(eq(uploadedPhotos.id, id));
    return result.rowCount > 0;
  }

  // Photo Like operations
  async getPhotoLikes(photoId: string): Promise<PhotoLike[]> {
    return await db.select().from(photoLikes).where(eq(photoLikes.photoId, photoId));
  }

  async createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike> {
    const [createdLike] = await db.insert(photoLikes).values(like).returning();
    return createdLike;
  }

  async hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(photoLikes)
      .where(eq(photoLikes.photoId, photoId))
      .where(eq(photoLikes.voterName, voterName));
    return !!existingLike;
  }

  // Quest Progress operations
  async getQuestProgress(): Promise<QuestProgress[]> {
    return await db.select().from(questProgress);
  }

  async getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]> {
    return await db.select().from(questProgress).where(eq(questProgress.participantName, participantName));
  }

  async createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress> {
    const [createdProgress] = await db.insert(questProgress).values(progress).returning();
    return createdProgress;
  }

  async updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined> {
    const updateData: any = { photosUploaded };
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    const [updatedProgress] = await db
      .update(questProgress)
      .set(updateData)
      .where(eq(questProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress> {
    const [existingProgress] = await db
      .select()
      .from(questProgress)
      .where(eq(questProgress.questId, questId))
      .where(eq(questProgress.participantName, participantName));

    if (existingProgress) {
      return existingProgress;
    }

    const [newProgress] = await db
      .insert(questProgress)
      .values({
        questId,
        participantName,
        photosUploaded: 0,
        isCompleted: false,
      })
      .returning();

    return newProgress;
  }

  // Auth operations
  async createAuthUser(userData: InsertAuthUser): Promise<AuthUser> {
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const [createdUser] = await db.insert(users).values({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: userData.passwordHash,
    }).returning();

    return createdUser;
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);
    return user || undefined;
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id)).limit(1);
    return user || undefined;
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
}

export const storage = new DatabaseStorage();