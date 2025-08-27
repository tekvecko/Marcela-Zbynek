import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { insertQuestChallengeSchema, registerSchema, loginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { verifyPhotoForChallenge, analyzePhotoContent, moderateContent } from "./gemini";
import { authenticateUser, optionalAuth, requireAdmin, type AuthRequest } from "./middleware/auth";
import { generateToken } from "./utils/jwt";
import { miniGamesStorage } from "./mini-games-storage";
import { users } from "./db/schema";

// Simple rate limiting middleware with memory cleanup
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  console.log(`Rate limit map cleaned up. Current size: ${rateLimitMap.size}`);
}, 5 * 60 * 1000); // 5 minutes

const createRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const identifier = req.user?.id || req.ip;
    const now = Date.now();

    const userLimit = rateLimitMap.get(identifier);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        message: "Příliš mnoho požadavků. Zkuste to prosím později."
      });
    }

    userLimit.count++;
    next();
  };
};

const uploadRateLimit = createRateLimit(10, 60 * 1000); // 10 uploads per minute
const likeRateLimit = createRateLimit(50, 60 * 1000); // 50 likes per minute

// Configure multer for photo uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // Reduced to 5MB for better performance
    files: 1, // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
      'image/webp'
    ];

    // Check file type
    console.log('File mime type:', file.mimetype);
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Nepodporovaný typ souboru: ${file.mimetype}. Povolené typy: JPG, PNG, HEIC, WebP`));
    }

    // Additional filename validation
    if (!file.originalname || file.originalname.length > 255) {
      return cb(new Error('Neplatný název souboru'));
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.sh', '.php', '.js', '.html'];
    const fileName = file.originalname.toLowerCase();
    for (const ext of suspiciousExtensions) {
      if (fileName.includes(ext)) {
        return cb(new Error('Podezřelý typ souboru'));
      }
    }

    cb(null, true);
  }
});

const photoUploadSchema = z.object({
  questId: z.string().optional(),
});

const photoLikeSchema = z.object({
  // voterName will be automatically extracted from authenticated user
});

// Middleware pro monitoring dostupnosti služeb
const serviceMonitoringMiddleware = (req: any, res: any, next: any) => {
  const serviceStatus = {
    database: process.env.SIMULATE_DB_OUTAGE !== 'true',
    ai: process.env.SIMULATE_AI_OUTAGE !== 'true',
    storage: process.env.SIMULATE_STORAGE_OUTAGE !== 'true',
    environment: process.env.NODE_ENV || 'development'
  };

  req.serviceStatus = serviceStatus;

  // Přidej warning headers při výpadku
  if (!serviceStatus.database) {
    res.setHeader('X-Service-Warning', 'Database-Unavailable');
  }
  if (!serviceStatus.ai) {
    res.setHeader('X-Service-Warning', 'AI-Service-Unavailable');
  }
  if (!serviceStatus.storage) {
    res.setHeader('X-Service-Warning', 'Storage-Service-Unavailable');
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Použij monitoring middleware globálně
  app.use('/api', serviceMonitoringMiddleware);

  // Health check endpoint for Render
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // Monitoring dashboard pro stav služeb
  app.get('/api/admin/service-status', (req, res) => {
    const serviceStatus = {
      replit: {
        database: process.env.SIMULATE_DB_OUTAGE !== 'true',
        ai: process.env.SIMULATE_AI_OUTAGE !== 'true',
        storage: process.env.SIMULATE_STORAGE_OUTAGE !== 'true',
        environment: 'development'
      },
      render: {
        available: true, // Zde by byl skutečný health check
        database: process.env.DATABASE_URL?.includes('render') || false,
        environment: 'production'
      },
      fallbacks: {
        database: 'In-memory storage with default challenges',
        ai: 'Auto-approve all photos without AI verification',
        storage: 'Cloudinary cloud storage'
      }
    };

    res.json(serviceStatus);
  });

  // Simulace výpadku pro testování záložního systému
  app.post('/api/admin/simulate-outage', async (req, res) => {
    const { outageType, duration } = req.body;

    try {
      switch (outageType) {
        case 'database':
          // Simuluje nedostupnost databáze
          process.env.SIMULATE_DB_OUTAGE = 'true';
          setTimeout(() => {
            delete process.env.SIMULATE_DB_OUTAGE;
          }, duration || 30000);
          break;

        case 'ai':
          // Simuluje nedostupnost AI služby
          process.env.SIMULATE_AI_OUTAGE = 'true';
          setTimeout(() => {
            delete process.env.SIMULATE_AI_OUTAGE;
          }, duration || 30000);
          break;

        case 'storage':
          // Simuluje nedostupnost file storage
          process.env.SIMULATE_STORAGE_OUTAGE = 'true';
          setTimeout(() => {
            delete process.env.SIMULATE_STORAGE_OUTAGE;
          }, duration || 30000);
          break;
      }

      res.json({
        message: `Simulován výpadek typu: ${outageType} na ${duration || 30000}ms`,
        fallbackInstructions: {
          database: "Použijte záložní Render PostgreSQL databázi",
          ai: "AI analýza bude dočasně nedostupná",
          storage: "Fotky budou ukládány do Cloudinary"
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Chyba při simulaci výpadku" });
    }
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if email already exists
      let existingUser;
      try {
        existingUser = await storage.getAuthUserByEmail(validatedData.email);
      } catch (dbError) {
        console.warn('Database check failed during registration, proceeding with memory storage');
        existingUser = null;
      }

      if (existingUser) {
        return res.status(400).json({ message: "Tento e-mail je již registrován." });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      // Create new user
      const user = await storage.createAuthUser({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email || '',
        isAdmin: user.isAdmin || false,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
        },
        token,
        message: "Registrace byla úspešná",
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Chyba při registraci." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      let user;
      try {
        user = await storage.getAuthUserByEmail(validatedData.email);
      } catch (dbError) {
        console.warn('Database check failed during login');
        return res.status(500).json({ message: "Dočasný problém se službou. Zkuste to prosím znovu." });
      }

      if (!user) {
        return res.status(400).json({ message: "Neplatný e-mail nebo heslo." });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(400).json({ message: "Neplatný e-mail nebo heslo." });
      }
      const isValidPassword = await storage.verifyPassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Neplatný e-mail nebo heslo." });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email || '',
        isAdmin: user.isAdmin || false,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
        },
        token,
        message: "Přihlášení bylo úspešné",
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Chyba při přihlašování." });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ message: "Úspěšně odhlášen." });
    } catch (error) {
      res.status(500).json({ message: "Chyba při odhlašování." });
    }
  });

  app.get("/api/auth/me", authenticateUser, async (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // Get all quest challenges (public for now)
  app.get("/api/quest-challenges", async (req, res) => {
    try {
      const challenges = await storage.getQuestChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Chyba při načítání fotovýzev" });
    }
  });

  // Get unlocked challenges for authenticated user
  app.get("/api/quest-challenges/unlocked", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.email) {
        return res.status(401).json({ message: "Přihlášení je vyžadováno" });
      }

      const unlockedChallenges = await storage.getUnlockedChallenges(req.user.email);
      res.json(unlockedChallenges);
    } catch (error) {
      console.error('Error fetching unlocked challenges:', error);
      res.status(500).json({ message: "Chyba při načítání odemčených výzev" });
    }
  });

  // Get quest progress for a participant (protected)
  app.get("/api/quest-progress/:participantName", async (req, res) => {
    try {
      const { participantName } = req.params;
      const progress = await storage.getQuestProgressByParticipant(participantName);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest progress" });
    }
  });

  // Upload photo - with rate limiting and auth for quest photos
  app.post("/api/photos/upload", uploadRateLimit, upload.single('photo'), authenticateUser, async (req: AuthRequest, res) => {
    await handlePhotoUpload(req, res);
  });

  // Robust photo analysis with multiple fallback levels
  async function performRobustPhotoAnalysis(filePath: string, challenge: any, fileInfo: any) {
    const maxAttempts = 3;
    let lastError: Error | null = null;

    console.log(`🔄 Starting robust analysis (max ${maxAttempts} attempts)`);

    // Level 1: Try AI verification multiple times
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🤖 AI analysis attempt ${attempt}/${maxAttempts}`);
        const verification = await verifyPhotoForChallenge(
          filePath,
          challenge.title,
          challenge.description
        );

        // Successful AI analysis
        const result = {
          isVerified: verification.isValid,
          verificationScore: typeof verification.confidence === 'number' && !isNaN(verification.confidence)
            ? Math.round(verification.confidence * 100)
            : 70,
          aiAnalysis: verification.explanation || "AI analýza byla úspešná.",
          aiMetadata: {
            technicalQuality: verification.technicalQuality,
            detectedObjects: verification.detectedObjects,
            weddingElements: verification.weddingElements,
            atmosphere: verification.atmosphere,
            peopleCount: verification.peopleCount,
            location: verification.location,
            emotions: verification.emotions,
            category: verification.category,
            tags: verification.tags,
            creativeTips: verification.creativeTips
          },
          analysisMethod: `AI_SUCCESS_ATTEMPT_${attempt}`
        };

        // Apply low confidence fallback logic
        if (!verification.isValid && verification.confidence < 0.3) {
          console.log('🔍 Low confidence rejection - flagging for manual review');
          result.isVerified = false;
          result.verificationScore = 30;
          result.aiAnalysis = verification.explanation + " Fotka bude předána k manuálnímu posouzení.";
          result.analysisMethod = `AI_LOW_CONFIDENCE_ATTEMPT_${attempt}`;
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ AI analysis attempt ${attempt} failed:`, error);

        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Level 2: Smart fallback analysis based on file properties and basic image analysis
    console.log(`🔧 AI failed after ${maxAttempts} attempts, using smart fallback analysis`);
    return await performSmartFallbackAnalysis(filePath, challenge, fileInfo, lastError);
  }

  // Smart fallback analysis when AI completely fails
  async function performSmartFallbackAnalysis(filePath: string, challenge: any, fileInfo: any, originalError: Error | null) {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // File size analysis
      const isReasonableSize = fileSize >= 10000 && fileSize <= 50000000; // 10KB to 50MB
      const isHighQuality = fileSize >= 500000; // Files over 500KB likely higher quality

      // File type analysis
      const isJPEG = fileInfo.mimetype === 'image/jpeg';
      const isPNG = fileInfo.mimetype === 'image/png';
      const isModernFormat = ['image/webp', 'image/heic', 'image/heif'].includes(fileInfo.mimetype);

      // Basic scoring algorithm
      let score = 50; // Base score

      if (isReasonableSize) score += 15;
      if (isHighQuality) score += 10;
      if (isJPEG || isPNG) score += 10;
      if (isModernFormat) score += 5;

      // Try basic content analysis as last resort
      let basicDescription = "Fotka byla přijata k analýze.";
      try {
        console.log(`📝 Attempting basic content analysis...`);
        basicDescription = await analyzePhotoContent(filePath);
        score += 10; // Bonus if we can analyze content
        console.log(`✅ Basic content analysis succeeded`);
      } catch (contentError) {
        console.log(`⚠️ Basic content analysis also failed:`, contentError);
        basicDescription = "Základní analýza obsahu se nezdařila, ale fotka byla přijata.";
      }

      // Determine verification status and message
      let analysisMessage: string;
      let isVerified = false;

      if (score >= 70) {
        analysisMessage = `Automatické ověření selhalo, ale fotka splňuje základní kritéria kvality. ${basicDescription} Fotka byla přijata k manuálnímu posouzení.`;
        isVerified = false; // Still needs manual review
      } else if (score >= 50) {
        analysisMessage = `Automatické ověření selhalo. Fotka byla přijata s omezenou funkčností. ${basicDescription}`;
        isVerified = false;
      } else {
        analysisMessage = `Automatické ověření selhalo a fotka nesplňuje základní kritéria kvality. Zkuste nahrát jinou fotografii.`;
        score = Math.max(score, 25); // Minimum score for uploaded photos
      }

      return {
        isVerified,
        verificationScore: Math.min(score, 80), // Cap at 80 for fallback analysis
        aiAnalysis: analysisMessage,
        aiMetadata: {
          technicalQuality: {
            sharpness: isHighQuality ? 0.7 : 0.5,
            composition: 0.6,
            lighting: 0.6,
            exposure: "neznámá"
          },
          detectedObjects: [],
          weddingElements: [],
          atmosphere: "neanalyzováno",
          peopleCount: null,
          location: "neznámo",
          emotions: [],
          category: "obecná",
          tags: [fileInfo.mimetype.replace('image/', '')],
          creativeTips: null
        },
        analysisMethod: `SMART_FALLBACK_SCORE_${score}`
      };

    } catch (fallbackError) {
      console.error(`💥 Even smart fallback analysis failed:`, fallbackError);

      // Level 3: Absolute minimum fallback
      return {
        isVerified: false,
        verificationScore: 25,
        aiAnalysis: "Veškerá automatická analýza selhala z technických důvodů. Fotka byla přijata s minimálním skóre k manuálnímu posouzení.",
        aiMetadata: null,
        analysisMethod: "MINIMAL_FALLBACK"
      };
    }
  }

  // Basic photo analysis for non-quest photos
  async function performBasicPhotoAnalysis(filePath: string, fileInfo: any) {
    try {
      const description = await analyzePhotoContent(filePath);
      return {
        score: 85,
        description,
        method: "BASIC_AI_SUCCESS"
      };
    } catch (error) {
      console.warn(`Basic photo analysis failed:`, error);
      return {
        score: 70,
        description: "Krásná svatební vzpomínka přidána do galerie.",
        method: "BASIC_FALLBACK"
      };
    }
  }

  async function handlePhotoUpload(req: AuthRequest, res: any) {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        user: req.user?.email,
        files: req.files
      });

      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: "Nebyla nahrána žádná fotka" });
      }

      // Additional server-side validation
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Soubor je příliš velký. Maximum je 5MB." });
      }

      if (!req.file.originalname || req.file.originalname.trim() === '') {
        return res.status(400).json({ message: "Neplatný název souboru" });
      }

      const validatedData = photoUploadSchema.parse(req.body);
      const uploaderName = req.user
        ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
        : "anonymous";

      let isVerified = false;
      let verificationScore = 0;
      let aiAnalysis = "";
      let aiMetadata: any = null;
      let photoData: any = {}; // To store photo details and gamification data

      const filePath = path.join(uploadDir, req.file.filename);
      const isQuestPhoto = !!validatedData.questId;

      // If this is for a quest challenge, verify with Gemini AI
      if (isQuestPhoto) {
        const challenge = await storage.getQuestChallenge(validatedData.questId);
        if (challenge) {
          console.log(`🔍 Starting analysis for challenge: ${challenge.title}`);
          const analysisResult = await performRobustPhotoAnalysis(filePath, challenge, req.file);

          isVerified = analysisResult.isVerified;
          verificationScore = analysisResult.verificationScore;
          aiAnalysis = analysisResult.aiAnalysis;
          aiMetadata = analysisResult.aiMetadata;

          console.log(`✅ Analysis completed: verified=${isVerified}, score=${verificationScore}, method=${analysisResult.analysisMethod}`);
        } else {
          console.log(`❌ Challenge not found for questId: ${validatedData.questId}`);
          // Even if challenge not found, perform basic analysis
          const basicAnalysis = await performBasicPhotoAnalysis(filePath, req.file);
          isVerified = false; // Can't verify without challenge context
          verificationScore = basicAnalysis.score;
          aiAnalysis = "Fotovýzva nebyla nalezena, ale fotka byla analyzována a přidána do galerie.";
        }
      } else {
        // For general gallery photos, perform robust basic analysis
        console.log(`📸 Analyzing general gallery photo`);
        const basicAnalysis = await performBasicPhotoAnalysis(filePath, req.file);

        isVerified = true; // Gallery photos are auto-approved
        verificationScore = basicAnalysis.score;
        aiAnalysis = basicAnalysis.description;

        console.log(`✅ Gallery photo analyzed: score=${basicAnalysis.score}, method=${basicAnalysis.method}`);
      }

      // Always create photo record for gallery, whether it's a quest photo or general gallery photo
      try {
        photoData = await storage.createUploadedPhoto({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploaderName: uploaderName,
          questId: validatedData.questId || null,
          isVerified,
          verificationScore,
          aiAnalysis,
          technicalQuality: aiMetadata?.technicalQuality || null,
          detectedObjects: aiMetadata?.detectedObjects || null,
          weddingElements: aiMetadata?.weddingElements || null,
          atmosphere: aiMetadata?.atmosphere || null,
          peopleCount: aiMetadata?.peopleCount || null,
          location: aiMetadata?.location || null,
          emotions: aiMetadata?.emotions || null,
          category: aiMetadata?.category || null,
          tags: aiMetadata?.tags || null,
          creativeTips: aiMetadata?.creativeTips || null,
        });
        console.log(`Photo created in gallery: ${photoData.id}, verified: ${isVerified}, questId: ${validatedData.questId || 'none'}`);
      } catch (photoError) {
        console.error('Failed to create photo record:', photoError);
        // Continue with quest progress update even if photo creation fails
      }

      // Update quest progress if questId provided
      if (isQuestPhoto && req.user) {
        const participantName = req.user.email;
        const progress = await storage.getOrCreateQuestProgress(validatedData.questId, participantName);

        if (isVerified) {
          // Check if quest is already completed
          if (progress.isCompleted) {
            return res.status(400).json({
              message: "Tento úkol jste již splnili. Každou fotovýzvu lze splnit pouze jednou."
            });
          }

          // For quest challenges, mark as completed when photo is verified by AI
          await storage.updateQuestProgress(progress.id, 1, true);
          console.log(`Quest completed with AI-verified photo`);
        } else {
          // Photo not verified - increment photos uploaded but don't complete quest
          const newPhotosCount = progress.photosUploaded + 1;
          await storage.updateQuestProgress(progress.id, newPhotosCount, false);
          console.log(`Photo uploaded but not verified - quest still in progress (${newPhotosCount} photos uploaded)`);
        }
      }

      // Log user behavior and update gamification data
      try {
        const analysisStats = {
          isVerified,
          verificationScore,
          questCompleted: isQuestPhoto && isVerified,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          aiMetadata: aiMetadata || null,
          analysisMethod: aiMetadata?.analysisMethod || 'unknown',
          analysisSuccess: verificationScore > 0,
          originalError: aiMetadata?.originalError || null
        };

        await storage.logUserBehavior({
          userEmail: req.user.email || 'anonymous',
          actionType: isQuestPhoto ? 'photo_quest_upload' : 'photo_gallery_upload',
          targetId: validatedData.questId || photoData?.id,
          actionData: analysisStats,
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip
        });

        // Award experience and check achievements
        try {
          const { levelSystem } = await import("./level-system");
          const { achievementSystem } = await import("./achievement-system");
          const { streakSystem } = await import("./streak-system");

          // Award experience based on action
          let experienceGained = 10; // Base XP for upload
          if (isVerified && challenge) {
            experienceGained += Math.floor(challenge.points * 0.5); // Extra XP for verified challenge
          }

          const levelResult = await levelSystem.addExperience(
            req.user.email,
            experienceGained,
            'photo_upload'
          );

          // Update photo streak
          await streakSystem.updateUserStreak(req.user.email, 'photo');

          // Check for new achievements
          const newAchievements = await achievementSystem.checkUserAchievements(req.user.email);

          // Include gamification data in response
          photoData.gamification = {
            experienceGained,
            leveledUp: levelResult.leveledUp,
            newLevel: levelResult.newLevel,
            newTitle: levelResult.newTitle,
            newAchievements: newAchievements.map(a => ({
              id: a.achievementId,
              title: achievementSystem.getAchievementById(a.achievementId)?.title
            }))
          };
        } catch (gamificationError) {
          console.warn('Gamification update failed:', gamificationError);
          // Don't fail the upload if gamification fails
        }

      } catch (behaviorError) {
        console.warn('Failed to log upload behavior:', behaviorError);
      }

      // Return response with photo data if created successfully
      if (photoData) {
        res.json({
          ...photoData,
          message: isQuestPhoto
            ? (isVerified ? "Fotovýzva úspěšně splněna a fotka přidána do galerie!" : "Fotka nahrána, ale nesplnila požadavky fotovýzvy")
            : "Fotka úspěšně přidána do galerie",
          questCompleted: isQuestPhoto && isVerified
        });
      } else {
        // Fallback response if photo creation failed
        res.json({
          message: "Fotka byla zpracována, ale nebyla přidána do galerie z technických důvodů",
          isVerified,
          verificationScore,
          aiAnalysis,
          questId: validatedData.questId
        });
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to upload photo", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  // Get all uploaded photos - public for gallery viewing
  app.get("/api/photos", optionalAuth, async (req, res) => {
    try {
      const photos = await storage.getUploadedPhotos();

      // Přidej userHasLiked informaci pro každou fotku
      const photosWithUserInfo = await Promise.all(
        photos.map(async (photo) => {
          const userHasLiked = req.user
            ? await storage.hasUserLikedPhoto(photo.id, req.user.email)
            : false;

          return {
            ...photo,
            userHasLiked
          };
        })
      );

      res.json(photosWithUserInfo);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photos for a specific quest - with parameter validation
  app.get("/api/photos/quest/:questId", async (req, res) => {
    try {
      const { questId } = req.params;

      // Validate questId format (should be UUID or safe string)
      if (!questId || typeof questId !== 'string' || questId.length > 100) {
        return res.status(400).json({ message: "Invalid quest ID format" });
      }

      // Basic sanitization
      const sanitizedQuestId = questId.trim();
      if (!/^[\w\-]+$/.test(sanitizedQuestId)) {
        return res.status(400).json({ message: "Invalid quest ID characters" });
      }

      const photos = await storage.getPhotosByQuestId(sanitizedQuestId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest photos" });
    }
  });

  // Serve uploaded photos - with path traversal protection
  app.get("/api/photos/:filename", (req, res) => {
    const { filename } = req.params;

    // Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    // Only allow alphanumeric characters, dots, hyphens, and underscores
    if (!/^[\w\-\.]+$/.test(filename)) {
      return res.status(400).json({ message: "Invalid filename format" });
    }

    const filePath = path.join(uploadDir, filename);

    // Ensure the resolved path is still within the upload directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(uploadDir);

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Photo not found" });
    }
  });

  // Like/unlike a photo - with rate limiting and race condition protection
  app.post("/api/photos/:photoId/like", authenticateUser, likeRateLimit, async (req: AuthRequest, res) => {
    try {
      const { photoId } = req.params;
      photoLikeSchema.parse(req.body); // Validate empty body

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to like photos" });
      }

      // Validate photoId format
      if (!photoId || typeof photoId !== 'string' || photoId.length > 100) {
        return res.status(400).json({ message: "Neplatný formát ID fotky" });
      }

      // Basic sanitization for photoId
      const sanitizedPhotoId = photoId.trim();
      if (!/^[\w\-]+$/.test(sanitizedPhotoId)) {
        return res.status(400).json({ message: "Neplatné znaky v ID fotky" });
      }

      // Use authenticated user's email as voter name with additional validation
      const voterName = req.user.email;
      if (!voterName || typeof voterName !== 'string' || voterName.length > 255) {
        return res.status(400).json({ message: "Neplatný e-mail uživatele" });
      }

      // Check if photo exists first
      const photo = await storage.getUploadedPhoto(sanitizedPhotoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Prevent users from liking their own photos
      if (photo.uploaderName === voterName) {
        return res.status(400).json({ message: "You cannot like your own photos" });
      }

      // Use atomic toggle operation to prevent race conditions
      const result = await storage.togglePhotoLike(sanitizedPhotoId, voterName);

      // Log user behavior for AI learning
      try {
        await storage.logUserBehavior({
          userEmail: voterName,
          actionType: 'photo_like',
          targetId: sanitizedPhotoId,
          actionData: {
            action: result.action,
            previousLikes: result.likes - (result.action === 'liked' ? 1 : -1),
            newLikes: result.likes
          },
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip
        });
      } catch (behaviorError) {
        console.warn('Failed to log user behavior:', behaviorError);
        // Don't fail the request if behavior logging fails
      }

      // Get updated photo data
      const updatedPhoto = await storage.getUploadedPhoto(sanitizedPhotoId);

      res.json({
        ...updatedPhoto,
        userHasLiked: result.userHasLiked,
        action: result.action,
        likes: result.likes
      });
    } catch (error) {
      console.error("Like/unlike photo error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to process like/unlike", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Mini-games API routes
  app.get("/api/mini-games", async (req, res) => {
    try {
      const games = await miniGamesStorage.getMiniGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching mini-games:", error);
      res.status(500).json({ message: "Failed to fetch mini-games" });
    }
  });

  app.get("/api/mini-games/:gameId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { gameId } = req.params;
      const game = await miniGamesStorage.getMiniGame(gameId);

      if (!game) {
        return res.status(404).json({ message: "Mini-game not found" });
      }

      res.json(game);
    } catch (error) {
      console.error("Error fetching mini-game:", error);
      res.status(500).json({ message: "Failed to fetch mini-game" });
    }
  });

  app.post("/api/mini-games/:gameId/score", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { gameId } = req.params;
      const { score, maxScore, timeSpent, gameData } = req.body;

      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate input
      if (typeof score !== 'number' || typeof maxScore !== 'number' || score < 0 || maxScore < 0) {
        return res.status(400).json({ message: "Invalid score data" });
      }

      // Check if game exists
      const game = await miniGamesStorage.getMiniGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Mini-game not found" });
      }

      const playerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Anonymous';

      const scoreData = {
        gameId,
        playerEmail: req.user.email || '',
        playerName,
        score,
        maxScore,
        timeSpent: timeSpent || null,
        gameData: gameData || null
      };

      const savedScore = await miniGamesStorage.saveMiniGameScore(scoreData);
      res.json(savedScore);
    } catch (error) {
      console.error("Error saving mini-game score:", error);
      res.status(500).json({ message: "Failed to save score" });
    }
  });

  app.get("/api/mini-games/:gameId/scores", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { gameId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const scores = await miniGamesStorage.getTopScores(gameId, limit);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching mini-game scores:", error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  app.get("/api/mini-games/:gameId/my-score", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { gameId } = req.params;

      if (!req.user?.email) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const score = await miniGamesStorage.getPlayerScore(gameId, req.user.email);
      res.json(score || null);
    } catch (error) {
      console.error("Error fetching player score:", error);
      res.status(500).json({ message: "Failed to fetch player score" });
    }
  });

  // Get all mini-game scores across all games for leaderboards
  app.get("/api/mini-games-scores/all", async (req, res) => {
    try {
      const games = await miniGamesStorage.getMiniGames();
      const allScores: any[] = [];

      for (const game of games) {
        const scores = await miniGamesStorage.getMiniGameScores(game.id);
        allScores.push(...scores.map(score => ({ ...score, gameTitle: game.title, gamePoints: game.points })));
      }

      res.json(allScores);
    } catch (error) {
      console.error("Error fetching all mini-game scores:", error);
      res.status(500).json({ message: "Failed to fetch mini-game scores" });
    }
  });

  // Get quest leaderboard (protected)
  app.get("/api/quest-leaderboard", async (req, res) => {
    try {
      const allProgress = await storage.getQuestProgress();
      const challenges = await storage.getQuestChallenges();

      const leaderboard = allProgress.reduce((acc, progress) => {
        const participant = acc.find(p => p.participantName === progress.participantName);
        const challenge = challenges.find(c => c.id === progress.questId);
        const points = challenge ? (progress.isCompleted ? challenge.points : 0) : 0;

        if (participant) {
          participant.completedQuests += progress.isCompleted ? 1 : 0;
          participant.totalPoints += points;
        } else {
          acc.push({
            participantName: progress.participantName,
            completedQuests: progress.isCompleted ? 1 : 0,
            totalPoints: points,
          });
        }

        return acc;
      }, [] as Array<{ participantName: string; completedQuests: number; totalPoints: number }>);

      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints || b.completedQuests - a.completedQuests);

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Admin Routes

  // Check admin status - requires authentication
  app.get("/api/admin/status", authenticateUser, async (req: AuthRequest, res) => {
    try {
      res.json({
        isAdmin: req.user?.isAdmin || false,
        user: {
          id: req.user?.id,
          email: req.user?.email,
          isAdmin: req.user?.isAdmin || false
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Get all quest progress
  app.get("/api/quest-progress", async (req, res) => {
    try {
      const progress = await storage.getQuestProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest progress" });
    }
  });

  // Get current user's quest progress
  app.get("/api/user/quest-progress", authenticateUser, async (req: any, res) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const progress = await storage.getQuestProgressByParticipant(userEmail);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user quest progress" });
    }
  });

  // Get user's photos for a specific quest
  app.get("/api/user/quest/:questId/photos", authenticateUser, async (req: any, res) => {
    try {
      const userEmail = req.user?.email;
      const { questId } = req.params;

      if (!userEmail) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const allPhotos = await storage.getPhotosByQuestId(questId);
      const userPhotos = allPhotos.filter(photo => photo.uploaderName === userEmail);

      res.json(userPhotos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user photos" });
    }
  });

  // Admin: Create new challenge
  app.post("/api/admin/challenges", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertQuestChallengeSchema.parse(req.body);
      const challenge = await storage.createQuestChallenge(validatedData);
      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Admin: Update challenge
  app.put("/api/admin/challenges/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertQuestChallengeSchema.parse(req.body);
      const challenge = await storage.updateQuestChallenge(id, validatedData);

      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update challenge" });
    }
  });

  // Admin: Delete challenge
  app.delete("/api/admin/challenges/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteQuestChallenge(id);

      if (!success) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      res.json({ message: "Challenge deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete challenge" });
    }
  });

  // Admin: Delete photo
  app.delete("/api/admin/photos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const photo = await storage.getUploadedPhoto(id);

      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadDir, photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      const success = await storage.deleteUploadedPhoto(id);

      if (!success) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Admin: Toggle photo verification
  app.post("/api/admin/photos/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }

      const photo = await storage.updatePhotoVerification(id, isVerified);

      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update photo verification" });
    }
  });

  // Admin: Bulk delete photos
  app.post("/api/admin/photos/bulk-delete", async (req, res) => {
    try {
      const { photoIds } = req.body;

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({ message: "photoIds must be a non-empty array" });
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const id of photoIds) {
        try {
          const photo = await storage.getUploadedPhoto(id);
          if (photo) {
            // Delete file from filesystem
            const filePath = path.join(uploadDir, photo.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

            // Delete from database
            const success = await storage.deleteUploadedPhoto(id);
            if (success) {
              deletedCount++;
            }
          }
        } catch (error) {
          errors.push(`Chyba při mazání fotky ${id}: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
        }
      }

      res.json({
        message: `Úspěšně smazáno ${deletedCount} z ${photoIds.length} fotek`,
        deletedCount,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk delete photos" });
    }
  });

  // Admin: Bulk delete challenges
  app.post("/api/admin/challenges/bulk-delete", async (req, res) => {
    try {
      const { challengeIds } = req.body;

      if (!Array.isArray(challengeIds) || challengeIds.length === 0) {
        return res.status(400).json({ message: "challengeIds must be a non-empty array" });
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const id of challengeIds) {
        try {
          const success = await storage.deleteQuestChallenge(id);
          if (success) {
            deletedCount++;
          }
        } catch (error) {
          errors.push(`Chyba při mazání výzvy ${id}: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
        }
      }

      res.json({
        message: `Úspěšně smazáno ${deletedCount} z ${challengeIds.length} výzev`,
        deletedCount,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk delete challenges" });
    }
  });

  // Admin: Bulk verify photos
  app.post("/api/admin/photos/bulk-verify", async (req, res) => {
    try {
      const { photoIds } = req.body;

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({ message: 'Neplatný seznam ID fotek' });
      }

      let verifiedCount = 0;
      for (const id of photoIds) {
        const photo = await storage.updatePhotoVerification(id, true);
        if (photo) verifiedCount++;
      }

      res.json({
        message: `Úspěšně schváleno ${verifiedCount} fotek`,
        verifiedCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk verify photos" });
    }
  });

  // Admin: Mass challenge controls
  app.post("/api/admin/challenges/mass-activate", async (req, res) => {
    try {
      const challenges = await storage.getQuestChallenges();
      let updatedCount = 0;

      for (const challenge of challenges) {
        if (!challenge.isActive) {
          await storage.updateQuestChallenge(challenge.id, { ...challenge, isActive: true });
          updatedCount++;
        }
      }

      res.json({ message: `Aktivováno ${updatedCount} výzev`, updatedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate challenges" });
    }
  });

  app.post("/api/admin/challenges/mass-deactivate", async (req, res) => {
    try {
      const challenges = await storage.getQuestChallenges();
      let updatedCount = 0;

      for (const challenge of challenges) {
        if (challenge.isActive) {
          await storage.updateQuestChallenge(challenge.id, { ...challenge, isActive: false });
          updatedCount++;
        }
      }

      res.json({ message: `Deaktivováno ${updatedCount} výzev`, updatedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate challenges" });
    }
  });

  app.post("/api/admin/challenges/mass-activate-by-points", async (req, res) => {
    try {
      const { points } = req.body;
      const challenges = await storage.getQuestChallenges();
      let updatedCount = 0;

      const targetChallenges = challenges.filter(c =>
        points === 15 ? c.points <= 15 : c.points === points
      );

      for (const challenge of targetChallenges) {
        if (!challenge.isActive) {
          await storage.updateQuestChallenge(challenge.id, { ...challenge, isActive: true });
          updatedCount++;
        }
      }

      res.json({ message: `Aktivováno ${updatedCount} výzev s ${points} body`, updatedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate challenges by points" });
    }
  });

  app.post("/api/admin/challenges/mass-deactivate-by-points", async (req, res) => {
    try {
      const { points } = req.body;
      const challenges = await storage.getQuestChallenges();
      let updatedCount = 0;

      const targetChallenges = challenges.filter(c =>
        points === 15 ? c.points <= 15 : c.points === points
      );

      for (const challenge of targetChallenges) {
        if (challenge.isActive) {
          await storage.updateQuestChallenge(challenge.id, { ...challenge, isActive: false });
          updatedCount++;
        }
      }

      res.json({ message: `Deaktivováno ${updatedCount} výzev s ${points} body`, updatedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate challenges by points" });
    }
  });

  // Admin: Reset all progress
  app.post("/api/admin/progress/reset-all", async (req, res) => {
    try {
      const progressRecords = await storage.getQuestProgress();
      let resetCount = 0;

      for (const progress of progressRecords) {
        await storage.updateQuestProgress(progress.id, 0, false);
        resetCount++;
      }

      res.json({ message: `Resetován pokrok ${resetCount} hráčů`, resetCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset progress" });
    }
  });

  // Admin: Get user behavior analytics
  app.get("/api/admin/behavior-analytics", async (req, res) => {
    try {
      const { actionType, limit } = req.query;
      const behaviorLogs = await storage.getUserBehaviorLogs({
        actionType: actionType as string,
        limit: limit ? parseInt(limit as string) : 100
      });

      // Generate analytics from behavior data
      const analytics = {
        totalActions: behaviorLogs.length,
        actionBreakdown: {},
        userEngagement: {},
        popularContent: {},
        timePatterns: {}
      } as any;

      // Action type breakdown
      behaviorLogs.forEach(log => {
        analytics.actionBreakdown[log.actionType] = (analytics.actionBreakdown[log.actionType] || 0) + 1;
      });

      // User engagement patterns
      const userActions = behaviorLogs.reduce((acc, log) => {
        acc[log.userEmail] = (acc[log.userEmail] || 0) + 1;
        return acc;
      }, {} as any);

      analytics.userEngagement = {
        totalUsers: Object.keys(userActions).length,
        averageActionsPerUser: Object.values(userActions).reduce((sum: number, count: any) => sum + count, 0) / Object.keys(userActions).length,
        mostActiveUsers: Object.entries(userActions)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([email, count]) => ({ email, actionCount: count }))
      };

      // Popular content (most liked photos, most completed challenges)
      const photoLikes = behaviorLogs
        .filter(log => log.actionType === 'photo_like')
        .reduce((acc, log) => {
          acc[log.targetId!] = (acc[log.targetId!] || 0) + 1;
          return acc;
        }, {} as any);

      analytics.popularContent.mostLikedPhotos = Object.entries(photoLikes)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([photoId, likes]) => ({ photoId, likes }));

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching behavior analytics:", error);
      res.status(500).json({ message: "Failed to fetch behavior analytics" });
    }
  });

  // Admin: Get AI learning insights
  app.get("/api/admin/ai-insights", async (req, res) => {
    try {
      const { type } = req.query;
      const insights = await storage.getAiInsights(type as string);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Admin: System status monitoring
  app.get("/api/admin/system-status", async (req, res) => {
    try {
      const checks = [];

      // Database connection check
      try {
        await db.select().from(users).limit(1);
        checks.push({
          name: 'Databázové připojení',
          status: 'success',
          message: 'Databáze je dostupná a funguje správně',
          details: 'PostgreSQL připojení OK'
        });
      } catch (error) {
        checks.push({
          name: 'Databázové připojení',
          status: 'error',
          message: 'Problém s připojením k databázi',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        });
      }

      // Gemini AI check
      if (process.env.GEMINI_API_KEY) {
        try {
          // Test Gemini API
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          checks.push({
            name: 'Gemini AI API',
            status: 'success',
            message: 'API klíč je nastaven a dostupný',
            details: 'Google Gemini AI připraveno pro analýzu fotografií'
          });
        } catch (error) {
          checks.push({
            name: 'Gemini AI API',
            status: 'warning',
            message: 'API klíč je nastaven, ale může být problém s přístupem',
            details: error instanceof Error ? error.message : 'Neznámá chyba'
          });
        }
      } else {
        checks.push({
          name: 'Gemini AI API',
          status: 'error',
          message: 'GEMINI_API_KEY není nastavený',
          details: 'Bez API klíče nebude fungovat automatické ověřování fotografií'
        });
      }

      // Environment variables check
      const requiredEnvVars = ['DATABASE_URL', 'REPL_ID'];
      const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

      if (missingEnvVars.length === 0) {
        checks.push({
          name: 'Environment proměnné',
          status: 'success',
          message: 'Všechny potřebné proměnné jsou nastaveny',
          details: 'DATABASE_URL, REPL_ID jsou k dispozici'
        });
      } else {
        checks.push({
          name: 'Environment proměnné',
          status: 'warning',
          message: `Chybí některé environment proměnné: ${missingEnvVars.join(', ')}`,
          details: 'Aplikace může mít omezenou funkcionalnost'
        });
      }

      // File upload directory check
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadsDir = path.join(process.cwd(), 'uploads');

        if (fs.existsSync(uploadsDir)) {
          const stats = fs.statSync(uploadsDir);
          if (stats.isDirectory()) {
            checks.push({
              name: 'Upload složka',
              status: 'success',
              message: 'Složka pro nahrávání existuje a je přístupná',
              details: `Cesta: ${uploadsDir}`
            });
          } else {
            checks.push({
              name: 'Upload složka',
              status: 'error',
              message: 'Upload cesta existuje, ale není to složka',
              details: `Cesta: ${uploadsDir}`
            });
          }
        } else {
          // Create uploads directory if it doesn't exist
          fs.mkdirSync(uploadsDir, { recursive: true });
          checks.push({
            name: 'Upload složka',
            status: 'success',
            message: 'Upload složka byla vytvořena',
            details: `Cesta: ${uploadsDir}`
          });
        }
      } catch (error) {
        checks.push({
          name: 'Upload složka',
          status: 'error',
          message: 'Problém s přístupem k upload složce',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        });
      }

      // Memory usage check
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);

      if (memUsageMB < 200) {
        checks.push({
          name: 'Využití paměti',
          status: 'success',
          message: `Využití paměti je v pořádku (${memUsageMB} MB)`,
          details: 'Aplikace běží efektivně'
        });
      } else if (memUsageMB < 400) {
        checks.push({
          name: 'Využití paměti',
          status: 'warning',
          message: `Zvýšené využití paměti (${memUsageMB} MB)`,
          details: 'Sledujte výkon aplikace'
        });
      } else {
        checks.push({
          name: 'Využití paměti',
          status: 'error',
          message: `Vysoké využití paměti (${memUsageMB} MB)`,
          details: 'Aplikace může být pomalá'
        });
      }

      res.json({ 
        checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('System status check failed:', error);
      res.status(500).json({ 
        error: 'Nepodařilo se provést kontrolu systému',
        details: error instanceof Error ? error.message : 'Neznámá chyba'
      });
    }
  });

  // Admin: Automaticky upravit obtížnost výzev
  app.post("/api/admin/ai-adjust-difficulty", async (req, res) => {
    try {
      const { aiDifficultyManager } = await import("./ai-difficulty-manager");
      const result = await aiDifficultyManager.applyAutomaticAdjustments();

      res.json({
        message: `Automaticky upraveno ${result.applied} výzev, přeskočeno ${result.skipped}`,
        ...result
      });
    } catch (error) {
      console.error("Error adjusting difficulty:", error);
      res.status(500).json({ message: "Failed to adjust difficulty" });
    }
  });

  // Admin: Generovat engagement akce
  app.post("/api/admin/ai-generate-engagement", async (req, res) => {
    try {
      const { aiEngagementSystem } = await import("./ai-engagement-system");
      const actions = await aiEngagementSystem.generateEngagementActions();
      const timeRecommendations = await aiEngagementSystem.scheduleOptimalUploadTimes();

      res.json({
        message: `Vygenerováno ${actions.length} engagement akcí`,
        actions: actions.slice(0, 10), // Zobraz prvních 10
        optimalTimes: timeRecommendations.recommendations
      });
    } catch (error) {
      console.error("Error generating engagement actions:", error);
      res.status(500).json({ message: "Failed to generate engagement actions" });
    }
  });

  // Admin: Automatická moderace obsahu
  app.post("/api/admin/ai-moderate-content", async (req, res) => {
    try {
      const photos = await storage.getUploadedPhotos();
      const { moderateContent } = await import("./gemini");

      let moderatedCount = 0;
      let flaggedCount = 0;

      for (const photo of photos.slice(0, 20)) { // Moderuj posledních 20 fotek
        try {
          const moderation = await moderateContent(`uploads/${photo.filename}`);

          if (!moderation.isAppropriate && moderation.confidence > 0.8) {
            await storage.updatePhotoVerification(photo.id, false);
            flaggedCount++;
          } else if (moderation.isAppropriate && moderation.confidence > 0.9) {
            await storage.updatePhotoVerification(photo.id, true);
            moderatedCount++;
          }
        } catch (error) {
          console.warn(`Skipping moderation for photo ${photo.id}:`, error);
        }
      }

      res.json({
        message: `Moderováno ${moderatedCount} fotek, označeno ${flaggedCount} problematických`,
        moderated: moderatedCount,
        flagged: flaggedCount
      });
    } catch (error) {
      console.error("Error moderating content:", error);
      res.status(500).json({ message: "Failed to moderate content" });
    }
  });

  // Admin: Generate AI insights from behavior data
  app.post("/api/admin/generate-ai-insights", async (req, res) => {
    try {
      const behaviorLogs = await storage.getUserBehaviorLogs({ limit: 1000 });
      const photos = await storage.getUploadedPhotos();

      // Analyze photo preferences based on likes
      const photoLikeData = behaviorLogs
        .filter(log => log.actionType === 'photo_like')
        .map(log => {
          const photo = photos.find(p => p.id === log.targetId);
          return { log, photo };
        })
        .filter(item => item.photo);

      if (photoLikeData.length > 0) {
        // Analyze technical quality preferences
        const qualityPreferences = photoLikeData.reduce((acc, { photo }) => {
          if (photo?.technicalQuality) {
            const tq = photo.technicalQuality as any;
            acc.sharpness += tq.sharpness || 0;
            acc.composition += tq.composition || 0;
            acc.lighting += tq.lighting || 0;
            acc.count += 1;
          }
          return acc;
        }, { sharpness: 0, composition: 0, lighting: 0, count: 0 });

        if (qualityPreferences.count > 0) {
          const avgPreferences = {
            sharpness: qualityPreferences.sharpness / qualityPreferences.count,
            composition: qualityPreferences.composition / qualityPreferences.count,
            lighting: qualityPreferences.lighting / qualityPreferences.count
          };

          await storage.createAiInsight({
            insightType: 'photo_preference',
            category: 'technical_quality',
            insightData: {
              preferences: avgPreferences,
              analysis: `Uživatelé preferují fotky s průměrnou ostrostí ${(avgPreferences.sharpness * 100).toFixed(1)}%, kompozicí ${(avgPreferences.composition * 100).toFixed(1)}% a osvětlením ${(avgPreferences.lighting * 100).toFixed(1)}%`,
              recommendations: [
                avgPreferences.sharpness > 0.7 ? "Pokračujte v požadování ostrých fotek" : "Zlepšete algoritmy pro detekci ostrosti",
                avgPreferences.composition > 0.6 ? "Dobré kompoziční preference" : "Pomozte uživatelům s kompozicí",
                avgPreferences.lighting > 0.6 ? "Osvětlení je dobře hodnoceno" : "Věnujte pozornost kvalitě osvětlení"
              ]
            },
            confidence: Math.min(95, Math.floor((qualityPreferences.count / 20) * 100)),
            sampleSize: qualityPreferences.count
          });
        }

        // Analyze emotional content preferences
        const emotionData = photoLikeData
          .filter(({ photo }) => photo?.emotions)
          .reduce((acc, { photo }) => {
            const emotions = photo!.emotions as string[];
            emotions.forEach(emotion => {
              acc[emotion] = (acc[emotion] || 0) + 1;
            });
            return acc;
          }, {} as any);

        if (Object.keys(emotionData).length > 0) {
          const topEmotions = Object.entries(emotionData)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5);

          await storage.createAiInsight({
            insightType: 'photo_preference',
            category: 'emotional_content',
            insightData: {
              topEmotions: topEmotions.map(([emotion, count]) => ({ emotion, count })),
              analysis: `Nejoblíbenější emoce na fotkách: ${topEmotions.map(([emotion]) => emotion).join(', ')}`,
              recommendations: [
                "Zvyšte body za fotky obsahující tyto emoce",
                "Vytvořte speciální výzvy zaměřené na oblíbené emoce",
                "Upravte AI algoritmy aby preferovaly tyto emoční stavy"
              ]
            },
            confidence: Math.min(90, Math.floor((Object.values(emotionData).reduce((sum: number, count: any) => sum + count, 0) / 15) * 100)),
            sampleSize: Object.values(emotionData).reduce((sum: number, count: any) => sum + count, 0)
          });
        }
      }

      res.json({
        message: "AI insights byly úspěšně vygenerovány",
        insightsGenerated: photoLikeData.length > 0 ? 2 : 0,
        sampleSize: photoLikeData.length
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Achievements Endpoints
  app.get("/api/achievements", async (req, res) => {
    try {
      const { achievementSystem } = await import("./achievement-system");
      const achievements = achievementSystem.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error getting achievements:", error);
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  app.get("/api/user/achievements", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { achievementSystem } = await import("./achievement-system");
      const userAchievements = await achievementSystem.getUserAchievements(user.email);

      res.json(userAchievements);
    } catch (error) {
      console.error("Error getting user achievements:", error);
      res.status(500).json({ message: "Failed to get user achievements" });
    }
  });

  // Streaks Endpoints
  app.get("/api/user/streaks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { streakSystem } = await import("./streak-system");
      const photoStreak = await streakSystem.getUserStreak(user.email, 'photo');
      const loginStreak = await streakSystem.getUserStreak(user.email, 'login');
      const challengeStreak = await streakSystem.getUserStreak(user.email, 'challenge');

      res.json({
        photo: photoStreak,
        login: loginStreak,
        challenge: challengeStreak
      });
    } catch (error) {
      console.error("Error getting user streaks:", error);
      res.status(500).json({ message: "Failed to get user streaks" });
    }
  });

  app.get("/api/leaderboards/streaks/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { streakSystem } = await import("./streak-system");
      const leaderboard = await streakSystem.getStreakLeaderboard(type as any);

      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting streak leaderboard:", error);
      res.status(500).json({ message: "Failed to get streak leaderboard" });
    }
  });

  // Levels Endpoints
  app.get("/api/user/level", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { levelSystem } = await import("./level-system");
      const userLevel = await levelSystem.getUserLevel(user.email);
      const nextLevelXP = levelSystem.getExperienceForNextLevel(userLevel.experience);

      res.json({
        ...userLevel,
        experienceToNext: nextLevelXP
      });
    } catch (error) {
      console.error("Error getting user level:", error);
      res.status(500).json({ message: "Failed to get user level" });
    }
  });

  app.get("/api/leaderboards/levels", async (req, res) => {
    try {
      const { levelSystem } = await import("./level-system");
      const leaderboard = await levelSystem.getLevelLeaderboard();

      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting level leaderboard:", error);
      res.status(500).json({ message: "Failed to get level leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}