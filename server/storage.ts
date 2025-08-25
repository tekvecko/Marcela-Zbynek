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
import { users, questChallenges, uploadedPhotos, photoLikes, questProgress, authSessions } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  cleanupAnonymousLikes(photoId: string): Promise<void>;
  removePhotoLike(photoId: string, voterName: string): Promise<boolean>;
  togglePhotoLike(photoId: string, voterName: string): Promise<{
    userHasLiked: boolean;
    likes: number;
    action: 'liked' | 'unliked';
  }>;

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
}

export class DatabaseStorage implements IStorage {
  private authSessions: Map<string, AuthSession>;
  private memoryFallback: MemStorage | null = null;

  constructor() {
    this.authSessions = new Map();
    // Pokud není databáze dostupná, použij memory storage
    if (!db) {
      console.log("🔄 Používám in-memory storage místo databáze");
      this.memoryFallback = new MemStorage();
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
      }
      return this.memoryFallback.getQuestChallenges();
    }
  }

  async getQuestChallenge(id: string): Promise<QuestChallenge | undefined> {
    try {
      const [challenge] = await db.select().from(questChallenges).where(eq(questChallenges.id, id));
      return challenge;
    } catch (error) {
      console.error(`Database getQuestChallenge failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.getQuestChallenge(id);
    }
  }

  async createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge> {
    try {
      const [createdChallenge] = await db.insert(questChallenges).values(challenge).returning();
      return createdChallenge;
    } catch (error) {
      console.error('Failed to create quest challenge:', error);
      throw error; // Re-throw to indicate failure
    }
  }

  async updateQuestChallenge(id: string, challenge: InsertQuestChallenge): Promise<QuestChallenge | undefined> {
    try {
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
      },
      {
        title: 'Konfety a rýže 🎊',
        description: 'Házení rýže, konfet nebo okvětních lístků',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Generační foto 👴👵',
        description: 'Tři generace na jedné fotce',
        targetPhotos: 1,
        points: 20,
        isActive: true,
      },
      {
        title: 'Podvazek tradice 🎀',
        description: 'Tradice s podvazkem',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Družička v akci 👭',
        description: 'Družičky pomáhají nebo se baví',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Místo obřadu 🏰',
        description: 'Zachyťte místo kde se koná svatební obřad',
        targetPhotos: 1,
        points: 10,
        isActive: true,
      },
      {
        title: 'Hudba živá 🎵',
        description: 'Hudebníci nebo DJ při práci',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Svatební auto 🚗',
        description: 'Auto nevěsty nebo ženicha s výzdobou',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Svatební boty 👠',
        description: 'Detail svatebních bot nevěsty nebo ženicha',
        targetPhotos: 1,
        points: 10,
        isActive: true,
      },
      {
        title: 'Detox slz 😢',
        description: 'Někdo se dojme až do slz štěstím',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },
      {
        title: 'Svatební svíčky 🕯️',
        description: 'Rituál se svatebními svíčkami',
        targetPhotos: 1,
        points: 18,
        isActive: true,
      },
      {
        title: 'Výzdoba stolu 🍽️',
        description: 'Krásně prostřený svatební stůl',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Příprava ženicha 🤵',
        description: 'Ženich se připravuje před obřadem',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      }
    ];

    defaultChallenges.forEach(challenge => {
      this.createQuestChallenge(challenge);
    });
  }

  // Photo operations
  async getUploadedPhotos(): Promise<UploadedPhoto[]> {
    try {
      return await db.select().from(uploadedPhotos);
    } catch (error) {
      console.error("Failed to get uploaded photos:", error);
      return [];
    }
  }

  async getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined> {
    try {
      const [photo] = await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.id, id));
      return photo;
    } catch (error) {
      console.error(`Failed to get uploaded photo ${id}:`, error);
      return undefined;
    }
  }

  async getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]> {
    try {
      return await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.questId, questId));
    } catch (error) {
      console.error(`Failed to get uploaded photos for quest ${questId}:`, error);
      return [];
    }
  }

  async createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto> {
    try {
      const [createdPhoto] = await db.insert(uploadedPhotos).values(photo).returning();
      return createdPhoto;
    } catch (error) {
      console.error('Database createUploadedPhoto failed, falling back to memory storage:', error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.createUploadedPhoto(photo);
    }
  }

  async updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined> {
    try {
      const [updatedPhoto] = await db
        .update(uploadedPhotos)
        .set({ likes })
        .where(eq(uploadedPhotos.id, id))
        .returning();
      return updatedPhoto;
    } catch (error) {
      console.error(`Failed to update likes for photo ${id}:`, error);
      return undefined;
    }
  }

  async updatePhotoVerification(id: string, isVerified: boolean): Promise<UploadedPhoto | undefined> {
    try {
      const [updatedPhoto] = await db
        .update(uploadedPhotos)
        .set({ isVerified })
        .where(eq(uploadedPhotos.id, id))
        .returning();
      return updatedPhoto;
    } catch (error) {
      console.error(`Failed to update verification for photo ${id}:`, error);
      return undefined;
    }
  }

  async deleteUploadedPhoto(id: string): Promise<boolean> {
    try {
      // Delete associated likes first
      await db.delete(photoLikes).where(eq(photoLikes.photoId, id));

      // Delete the photo
      const result = await db.delete(uploadedPhotos).where(eq(uploadedPhotos.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Failed to delete uploaded photo ${id}:`, error);
      return false;
    }
  }

  // Photo Like operations
  async getPhotoLikes(photoId: string): Promise<PhotoLike[]> {
    try {
      return await db.select().from(photoLikes).where(eq(photoLikes.photoId, photoId));
    } catch (error) {
      console.error(`Failed to get likes for photo ${photoId}:`, error);
      return [];
    }
  }

  async createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike> {
    try {
      const [createdLike] = await db.insert(photoLikes).values(like).returning();
      return createdLike;
    } catch (error) {
      console.error('Failed to create photo like:', error);
      throw error;
    }
  }

  async hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean> {
    try {
      const [existingLike] = await db
        .select()
        .from(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)));
      return !!existingLike;
    } catch (error) {
      console.error(`Failed to check if user ${voterName} liked photo ${photoId}:`, error);
      return false;
    }
  }

  async cleanupAnonymousLikes(photoId: string): Promise<void> {
    try {
      await db
        .delete(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, "anonymous")));
    } catch (error) {
      console.error(`Failed to cleanup anonymous likes for photo ${photoId}:`, error);
    }
  }

  async removePhotoLike(photoId: string, voterName: string): Promise<boolean> {
    try {
      const result = await db.delete(photoLikes)
        .where(and(
          eq(photoLikes.photoId, photoId),
          eq(photoLikes.voterName, voterName)
        ));

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Failed to remove like for photo ${photoId} by ${voterName}:`, error);
      return false;
    }
  }

  // Thread-safe atomic like/unlike operation to prevent race conditions
  async togglePhotoLike(photoId: string, voterName: string): Promise<{
    userHasLiked: boolean;
    likes: number;
    action: 'liked' | 'unliked';
  }> {
    // Use database transaction for atomicity
    return await db.transaction(async (tx) => {
      // Check current photo existence
      const [photo] = await tx.select().from(uploadedPhotos).where(eq(uploadedPhotos.id, photoId));
      if (!photo) {
        throw new Error('Fotka nebyla nalezena');
      }

      // Check current like status
      const [existingLike] = await tx
        .select()
        .from(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.voterName, voterName)));

      if (existingLike) {
        // Remove like
        await tx.delete(photoLikes)
          .where(and(
            eq(photoLikes.photoId, photoId),
            eq(photoLikes.voterName, voterName)
          ));

        // Update photo likes count atomically
        const newLikeCount = Math.max(0, photo.likes - 1);
        await tx.update(uploadedPhotos)
          .set({ likes: newLikeCount })
          .where(eq(uploadedPhotos.id, photoId));

        return {
          userHasLiked: false,
          likes: newLikeCount,
          action: 'unliked'
        };
      } else {
        // Add like
        await tx.insert(photoLikes).values({
          photoId,
          voterName,
        });

        // Update photo likes count atomically
        const newLikeCount = photo.likes + 1;
        await tx.update(uploadedPhotos)
          .set({ likes: newLikeCount })
          .where(eq(uploadedPhotos.id, photoId));

        return {
          userHasLiked: true,
          likes: newLikeCount,
          action: 'liked'
        };
      }
    });
  }

  // Quest Progress operations
  async getQuestProgress(): Promise<QuestProgress[]> {
    try {
      return await db.select().from(questProgress);
    } catch (error) {
      console.error("Failed to get quest progress:", error);
      return [];
    }
  }

  async getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]> {
    try {
      return await db.select().from(questProgress).where(eq(questProgress.participantName, participantName));
    } catch (error) {
      console.error(`Database getQuestProgressByParticipant failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.getQuestProgressByParticipant(participantName);
    }
  }

  async createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress> {
    try {
      const [createdProgress] = await db.insert(questProgress).values(progress).returning();
      return createdProgress;
    } catch (error) {
      console.error('Failed to create quest progress:', error);
      throw error;
    }
  }

  async updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined> {
    const updateData: any = { photosUploaded };
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    try {
      const [updatedProgress] = await db
        .update(questProgress)
        .set(updateData)
        .where(eq(questProgress.id, id))
        .returning();
      return updatedProgress;
    } catch (error) {
      console.error(`Database updateQuestProgress failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.updateQuestProgress(id, photosUploaded, isCompleted);
    }
  }

  async getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress> {
    try {
      const [existingProgress] = await db
        .select()
        .from(questProgress)
        .where(and(eq(questProgress.questId, questId), eq(questProgress.participantName, participantName)));

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
    } catch (error) {
      console.error(`Database getOrCreateQuestProgress failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.getOrCreateQuestProgress(questId, participantName);
    }
  }

  // Auth operations
  async createAuthUser(userData: InsertAuthUser): Promise<AuthUser> {
    try {
      if (userData.email) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
        if (existingUser) {
          throw new Error("User with this email already exists.");
        }
      }

      const [createdUser] = await db.insert(users).values({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash,
      }).returning();

      return createdUser;
    } catch (error) {
      console.error('Database createAuthUser failed, falling back to memory storage:', error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.createAuthUser(userData);
    }
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user || undefined;
    } catch (error) {
      console.error(`Database getAuthUserByEmail failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.getAuthUserByEmail(email);
    }
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user || undefined;
    } catch (error) {
      console.error(`Database getAuthUserById failed, falling back to memory storage:`, error);
      // Fallback to memory storage
      if (!this.memoryFallback) {
        this.memoryFallback = new MemStorage();
      }
      return this.memoryFallback.getAuthUserById(id);
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  }

  async createAuthSession(userId: string): Promise<AuthSession> {
    const sessionToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    try {
      const [session] = await db.insert(authSessions).values({
        userId,
        sessionToken,
        expiresAt,
      }).returning();

      return session;
    } catch (error) {
      console.error('Failed to create auth session:', error);
      throw error;
    }
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    try {
      const [session] = await db.select().from(authSessions)
        .where(eq(authSessions.sessionToken, token))
        .limit(1);

      if (session && session.expiresAt > new Date()) {
        return session;
      }
      return undefined;
    } catch (error) {
      console.error('Failed to get auth session by token:', error);
      return undefined;
    }
  }

  async deleteAuthSession(sessionId: string): Promise<boolean> {
    try {
      const result = await db.delete(authSessions).where(eq(authSessions.id, sessionId));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Failed to delete auth session ${sessionId}:`, error);
      return false;
    }
  }
}

// Create storage instance with fallback
let storage: IStorage;

try {
  // Try to use database storage first
  storage = new DatabaseStorage();
} catch (error) {
  console.warn('Database not available, using memory storage:', error);
  storage = new MemStorage();
}

// Export with fallback logic
export { storage };