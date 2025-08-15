import { 
  type User, 
  type InsertUser,
  type QuestChallenge,
  type InsertQuestChallenge,
  type UploadedPhoto,
  type InsertUploadedPhoto,
  type PhotoLike,
  type InsertPhotoLike,
  type QuestProgress,
  type InsertQuestProgress
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getQuestChallenges(): Promise<QuestChallenge[]>;
  getQuestChallenge(id: string): Promise<QuestChallenge | undefined>;
  createQuestChallenge(challenge: InsertQuestChallenge): Promise<QuestChallenge>;
  
  getUploadedPhotos(): Promise<UploadedPhoto[]>;
  getUploadedPhoto(id: string): Promise<UploadedPhoto | undefined>;
  getPhotosByQuestId(questId: string): Promise<UploadedPhoto[]>;
  createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto>;
  updatePhotoLikes(id: string, likes: number): Promise<UploadedPhoto | undefined>;
  
  getPhotoLikes(photoId: string): Promise<PhotoLike[]>;
  createPhotoLike(like: InsertPhotoLike): Promise<PhotoLike>;
  hasUserLikedPhoto(photoId: string, voterName: string): Promise<boolean>;
  
  getQuestProgress(): Promise<QuestProgress[]>;
  getQuestProgressByParticipant(participantName: string): Promise<QuestProgress[]>;
  createQuestProgress(progress: InsertQuestProgress): Promise<QuestProgress>;
  updateQuestProgress(id: string, photosUploaded: number, isCompleted?: boolean): Promise<QuestProgress | undefined>;
  getOrCreateQuestProgress(questId: string, participantName: string): Promise<QuestProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private questChallenges: Map<string, QuestChallenge>;
  private uploadedPhotos: Map<string, UploadedPhoto>;
  private photoLikes: Map<string, PhotoLike>;
  private questProgress: Map<string, QuestProgress>;

  constructor() {
    this.users = new Map();
    this.questChallenges = new Map();
    this.uploadedPhotos = new Map();
    this.photoLikes = new Map();
    this.questProgress = new Map();
    
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
        title: 'Všichni tančí 🕺',
        description: 'Hosté se baví na tanečním parketu',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Třídení fotek 📱',
        description: 'Hosté si prohlížejí a sdílejí fotky z večera',
        targetPhotos: 1,
        points: 10,
        isActive: true,
      },

      // Detaily a atmosféra
      {
        title: 'Svatební dort 🎂',
        description: 'Krájení nebo detail svatebního dortu',
        targetPhotos: 1,
        points: 15,
        isActive: true,
      },
      {
        title: 'Svatební kytice 💐',
        description: 'Krásná svatební kytice nevěsty',
        targetPhotos: 1,
        points: 12,
        isActive: true,
      },
      {
        title: 'Dekorace a výzdoba 🌸',
        description: 'Příprava místa, květiny, svíčky',
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
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
}

export const storage = new MemStorage();
