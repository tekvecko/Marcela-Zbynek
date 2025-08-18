import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupGoogleAuth, isAuthenticated } from "./googleAuth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifyPhotoForChallenge, analyzePhotoContent } from "./gemini";

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
  // Auth middleware
  await setupGoogleAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all quest challenges
  app.get("/api/quest-challenges", async (req, res) => {
    try {
      const challenges = await storage.getQuestChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest challenges" });
    }
  });

  // Get quest progress for a participant
  app.get("/api/quest-progress/:participantName", async (req, res) => {
    try {
      const { participantName } = req.params;
      const progress = await storage.getQuestProgressByParticipant(participantName);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest progress" });
    }
  });

  // Upload photo - requires authentication and rate limiting
  app.post("/api/photos/upload", isAuthenticated, uploadRateLimit, upload.single('photo'), async (req: any, res) => {
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

      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validatedData = photoUploadSchema.parse(req.body);
      const uploaderName = req.user.given_name || req.user.firstName || req.user.email;
      
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
      if (validatedData.questId) {
        const participantName = req.user.given_name || req.user.firstName || req.user.email;
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
  });

  // Get all uploaded photos - public for gallery viewing
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getUploadedPhotos();
      res.json(photos);
    } catch (error) {
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

  // Like/unlike a photo - requires authentication and rate limiting
  app.post("/api/photos/:photoId/like", isAuthenticated, likeRateLimit, async (req: any, res) => {
    try {
      const { photoId } = req.params;
      photoLikeSchema.parse(req.body); // Validate empty body

      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
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

      const voterName = req.user.given_name || req.user.firstName || req.user.email;
      
      const photo = await storage.getUploadedPhoto(sanitizedPhotoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const hasLiked = await storage.hasUserLikedPhoto(sanitizedPhotoId, voterName);
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to like photo" });
    }
  });

  // Get quest leaderboard
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

  const httpServer = createServer(app);
  return httpServer;
}
