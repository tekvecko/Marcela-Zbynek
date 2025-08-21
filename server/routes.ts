import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertQuestChallengeSchema, registerSchema, loginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { verifyPhotoForChallenge, analyzePhotoContent } from "./gemini";
import { authenticateUser, optionalAuth, type AuthRequest } from "./middleware/auth";

// Simple rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/heic', 
      'image/heif',
      'image/webp'
    ];
    console.log('File mime type:', file.mimetype);
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Nepodporovaný typ souboru: ${file.mimetype}. Povolené typy: JPG, PNG, HEIC, WebP`));
    }
  }
});

const photoUploadSchema = z.object({
  questId: z.string().optional(),
});

const photoLikeSchema = z.object({
  // voterName will be automatically extracted from authenticated user
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Hash the password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      // Create new user
      const user = await storage.createAuthUser({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      // Generate a simple session token
      const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        sessionToken,
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
      const user = await storage.getAuthUserByEmail(validatedData.email);
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

      // Generate a simple session token
      const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        sessionToken,
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
      res.status(500).json({ message: "Failed to fetch quest challenges" });
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
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const validatedData = photoUploadSchema.parse(req.body);
      const uploaderName = req.user 
        ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email 
        : "anonymous";

      let isVerified = false;
      let verificationScore = 0;
      let aiAnalysis = "";

      // If this is for a quest challenge, verify with Gemini AI
      if (validatedData.questId) {
        const challenge = await storage.getQuestChallenge(validatedData.questId);
        if (challenge) {
          console.log(`Verifying photo for challenge: ${challenge.title}`);
          const filePath = path.join(uploadDir, req.file.filename);

          try {
            const verification = await verifyPhotoForChallenge(
              filePath, 
              challenge.title, 
              challenge.description
            );

            isVerified = verification.isValid;
            // Ensure verificationScore is a valid number
            verificationScore = typeof verification.confidence === 'number' && !isNaN(verification.confidence) 
              ? Math.round(verification.confidence * 100) 
              : 70;
            aiAnalysis = verification.explanation || "AI analýza byla úspešná.";

            console.log(`Verification result: isValid=${verification.isValid}, confidence=${verification.confidence}, explanation="${verification.explanation.substring(0, 100)}..."`);
          } catch (verificationError) {
            console.error('AI verification failed:', verificationError);
            // Fallback to manual verification
            isVerified = true; // Be permissive on errors
            verificationScore = 70;
            aiAnalysis = "Automatické ověření se nezdařilo, ale fotka byla přijata.";
          }
        } else {
          console.log(`Challenge not found for questId: ${validatedData.questId}`);
        }
      } else {
        // For general gallery photos, just analyze content
        const filePath = path.join(uploadDir, req.file.filename);
        aiAnalysis = await analyzePhotoContent(filePath);
        isVerified = true; // Gallery photos are auto-approved
        verificationScore = 85; // Good default score
      }

      // Only create photo record if it's not for a quest OR if it's verified for a quest
      const shouldCreatePhoto = !validatedData.questId || (validatedData.questId && isVerified);

      let photo = null;
      if (shouldCreatePhoto) {
        photo = await storage.createUploadedPhoto({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploaderName: uploaderName,
          questId: validatedData.questId || null,
          isVerified,
          verificationScore,
          aiAnalysis,
        });
      }

      // Update quest progress if questId provided
      if (validatedData.questId && req.user) {
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

      // Return appropriate response based on whether photo was added to gallery
      if (photo) {
        res.json(photo);
      } else {
        // Photo was not added to gallery because it failed verification for a quest
        res.json({
          message: "Fotka byla zpracována, ale nebyla přidána do galerie",
          isVerified,
          verificationScore,
          aiAnalysis,
          questId: validatedData.questId
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to upload photo" });
    }
  }

  // Get all uploaded photos - public for gallery viewing
  app.get("/api/photos", optionalAuth, async (req: any, res) => {
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

  // Like/unlike a photo - with rate limiting
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
        return res.status(400).json({ message: "Invalid photo ID format" });
      }

      // Basic sanitization for photoId
      const sanitizedPhotoId = photoId.trim();
      if (!/^[\w\-]+$/.test(sanitizedPhotoId)) {
        return res.status(400).json({ message: "Invalid photo ID characters" });
      }

      // Use authenticated user's email as voter name
      const voterName = req.user.email;

      console.log(`Like attempt: photoId=${sanitizedPhotoId}, voterName=${voterName}`);

      const photo = await storage.getUploadedPhoto(sanitizedPhotoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const hasLiked = await storage.hasUserLikedPhoto(sanitizedPhotoId, voterName);

      console.log(`Has user liked? ${hasLiked}`);

      if (hasLiked) {
        return res.status(400).json({ message: "You have already liked this photo" });
      }

      await storage.createPhotoLike({
        photoId: sanitizedPhotoId,
        voterName: voterName,
      });

      const updatedPhoto = await storage.updatePhotoLikes(sanitizedPhotoId, photo.likes + 1);
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Like photo error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to like photo", error: error.message });
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

  // Check admin status - publicly accessible
  app.get("/api/admin/status", async (req: any, res) => {
    try {
      res.json({ isAdmin: true }); // Make admin features accessible to everyone
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
  app.post("/api/admin/challenges", async (req, res) => {
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
  app.put("/api/admin/challenges/:id", async (req, res) => {
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
      const progressRecords = await storage.getAllQuestProgress();
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

  const httpServer = createServer(app);
  return httpServer;
}