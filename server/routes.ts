import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifyPhotoForChallenge, analyzePhotoContent } from "./gemini";

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
  uploaderName: z.string().min(1, "Uploader name is required"),
  questId: z.string().optional(),
});

const photoLikeSchema = z.object({
  voterName: z.string().min(1, "Voter name is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Upload photo
  app.post("/api/photos/upload", upload.single('photo'), async (req, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        files: req.files
      });
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const validatedData = photoUploadSchema.parse(req.body);
      
      let isVerified = false;
      let verificationScore = 0;
      let aiAnalysis = "";
      
      // If this is for a quest challenge, verify with Gemini AI
      if (validatedData.questId) {
        const challenge = await storage.getQuestChallenge(validatedData.questId);
        if (challenge) {
          console.log(`Verifying photo for challenge: ${challenge.title}`);
          const filePath = path.join(uploadDir, req.file.filename);
          const verification = await verifyPhotoForChallenge(
            filePath, 
            challenge.title, 
            challenge.description
          );
          
          isVerified = verification.isValid;
          verificationScore = Math.round(verification.confidence * 100);
          aiAnalysis = verification.explanation;
          
          console.log(`Verification result: ${verification.isValid}, confidence: ${verification.confidence}`);
        }
      } else {
        // For general gallery photos, just analyze content
        const filePath = path.join(uploadDir, req.file.filename);
        aiAnalysis = await analyzePhotoContent(filePath);
        isVerified = true; // Gallery photos are auto-approved
        verificationScore = 85; // Good default score
      }
      
      const photo = await storage.createUploadedPhoto({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploaderName: validatedData.uploaderName,
        questId: validatedData.questId || null,
        isVerified,
        verificationScore,
        aiAnalysis,
      });

      // Update quest progress if questId provided and photo is verified
      if (validatedData.questId && isVerified) {
        const progress = await storage.getOrCreateQuestProgress(validatedData.questId, validatedData.uploaderName);
        
        // Check if quest is already completed
        if (progress.isCompleted) {
          return res.status(400).json({ 
            message: "Tento úkol jste již splnili. Každou fotovýzvu lze splnit pouze jednou." 
          });
        }
        
        const challenge = await storage.getQuestChallenge(validatedData.questId);
        const newPhotosCount = progress.photosUploaded + 1;
        const isCompleted = challenge ? newPhotosCount >= challenge.targetPhotos : false;
        
        await storage.updateQuestProgress(progress.id, newPhotosCount, isCompleted);
        console.log(`Updated quest progress: ${newPhotosCount}/${challenge?.targetPhotos} photos`);
      } else if (validatedData.questId && !isVerified) {
        console.log('Photo not verified - quest progress not updated');
      }

      res.json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Get all uploaded photos
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getUploadedPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photos for a specific quest
  app.get("/api/photos/quest/:questId", async (req, res) => {
    try {
      const { questId } = req.params;
      const photos = await storage.getPhotosByQuestId(questId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quest photos" });
    }
  });

  // Serve uploaded photos
  app.get("/api/photos/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Photo not found" });
    }
  });

  // Like/unlike a photo
  app.post("/api/photos/:photoId/like", async (req, res) => {
    try {
      const { photoId } = req.params;
      const validatedData = photoLikeSchema.parse(req.body);
      
      const photo = await storage.getUploadedPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const hasLiked = await storage.hasUserLikedPhoto(photoId, validatedData.voterName);
      
      if (hasLiked) {
        return res.status(400).json({ message: "You have already liked this photo" });
      }

      await storage.createPhotoLike({
        photoId,
        voterName: validatedData.voterName,
      });

      const updatedPhoto = await storage.updatePhotoLikes(photoId, photo.likes + 1);
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
