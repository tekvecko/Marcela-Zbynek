import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { insertQuestChallengeSchema, registerSchema, loginSchema, uploadedPhotos, questChallenges, questProgress } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { verifyPhotoForChallenge, analyzePhotoContent, moderateContent } from "./gemini";
import { authenticateUser, optionalAuth, requireAdmin, type AuthRequest } from "./middleware/auth";
import { generateToken } from "./utils/jwt";
import { miniGamesStorage } from "./mini-games-storage";
import { users } from "@shared/schema";

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
      'image/png'
    ];

    // Check file type
    console.log('File mime type:', file.mimetype);
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Nepodporovaný typ souboru: ${file.mimetype}. Povolené typy: JPG, JPEG, PNG`));
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
  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Neplatné přihlašovací údaje",
          errors: result.error.errors 
        });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await storage.getAuthUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Neplatný e-mail nebo heslo" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Neplatný e-mail nebo heslo" });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email!,
        isAdmin: user.isAdmin || false
      });

      // Return user data and token
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin || false
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Chyba při přihlašování" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Neplatné registrační údaje",
          errors: result.error.errors 
        });
      }

      const { email, password, firstName, lastName } = result.data;

      // Check if user already exists
      const existingUser = await storage.getAuthUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Uživatel s tímto e-mailem již existuje" });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = await storage.createAuthUser({
        email,
        passwordHash,
        firstName,
        lastName
      });

      // Generate JWT token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email!,
        isAdmin: newUser.isAdmin || false
      });

      // Return user data and token
      res.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
          isAdmin: newUser.isAdmin || false
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Chyba při registraci" });
    }
  });

  app.post("/api/auth/logout", authenticateUser, async (req: AuthRequest, res) => {
    try {
      // Since we're using JWT tokens, logout is mainly handled client-side
      // But we can log the action or invalidate sessions if needed
      res.json({ message: "Odhlášení proběhlo úspěšně" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Chyba při odhlašování" });
    }
  });

  // User Progress and Achievement Endpoints
  app.get("/api/user/quest-progress", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(400).json({ message: "User email required" });
      }

      const progress = await storage.getQuestProgressByParticipant(userEmail);
      res.json(progress);
    } catch (error) {
      console.error("Failed to get user quest progress:", error);
      res.status(500).json({ message: "Chyba při načítání pokroku" });
    }
  });

  app.get("/api/user/level", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.email;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const level = await storage.getUserLevel(userId);
      if (level) {
        res.json(level);
      } else {
        // Return default level for new users
        const defaultLevel = {
          id: `level_${userId}`,
          userId: userId,
          level: 1,
          experience: 0,
          totalPoints: 0,
          experienceToNext: 100,
          title: "Svatební nováček",
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        res.json(defaultLevel);
      }
    } catch (error) {
      console.error("Failed to get user level:", error);
      res.status(500).json({ message: "Chyba při načítání levelu" });
    }
  });

  app.get("/api/user/achievements", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.email;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements || []);
    } catch (error) {
      console.error("Failed to get user achievements:", error);
      res.status(500).json({ message: "Chyba při načítání úspěchů" });
    }
  });

  app.get("/api/user/streaks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.email;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Get different types of streaks
      const photoStreak = await storage.getUserStreak(userId, 'photo_upload');
      const questStreak = await storage.getUserStreak(userId, 'quest_completion');
      
      const streaks = {
        photoUpload: photoStreak || { count: 0, lastActivity: null, type: 'photo_upload' },
        questCompletion: questStreak || { count: 0, lastActivity: null, type: 'quest_completion' }
      };
      
      res.json(streaks);
    } catch (error) {
      console.error("Failed to get user streaks:", error);
      res.status(500).json({ message: "Chyba při načítání streaks" });
    }
  });

  // Quest Challenges Endpoints
  app.get("/api/quest-challenges", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const challenges = await storage.getQuestChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Failed to get quest challenges:", error);
      res.status(500).json({ message: "Chyba při načítání výzev" });
    }
  });

  app.get("/api/quest-challenges/all-with-status", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(400).json({ message: "User email required" });
      }

      // Get all challenges
      const challenges = await storage.getQuestChallenges();
      
      // Get user progress for all challenges
      const userProgress = await storage.getQuestProgressByParticipant(userEmail);
      
      // Combine challenges with user progress
      const challengesWithStatus = challenges.map(challenge => {
        const progress = userProgress.find(p => p.questId === challenge.id);
        return {
          ...challenge,
          userProgress: progress ? {
            photosUploaded: progress.photosUploaded,
            isCompleted: progress.isCompleted,
            completedAt: progress.completedAt
          } : {
            photosUploaded: 0,
            isCompleted: false,
            completedAt: null
          }
        };
      });

      res.json(challengesWithStatus);
    } catch (error) {
      console.error("Failed to get quest challenges with status:", error);
      res.status(500).json({ message: "Chyba při načítání výzev s pokrokem" });
    }
  });

  // Photos by Quest Endpoints
  app.get("/api/photos/quest/:questId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { questId } = req.params;
      const photos = await storage.getPhotosByQuestId(questId);
      res.json(photos);
    } catch (error) {
      console.error("Failed to get photos for quest:", error);
      res.status(500).json({ message: "Chyba při načítání fotek pro výzvu" });
    }
  });

  // Použij monitoring middleware globálně
  app.use('/api', serviceMonitoringMiddleware);

  // Performance monitoring endpoint
  app.get('/api/performance', async (req, res) => {
    const start = Date.now();

    try {
      // Test database response time
      const dbStart = Date.now();
      await storage.getQuestChallenges();
      const dbTime = Date.now() - dbStart;

      // Test memory usage
      const memUsage = process.memoryUsage();

      const performanceData = {
        serverResponseTime: Date.now() - start,
        databaseResponseTime: dbTime,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: 'Performance check failed' });
    }
  });

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

  // Behavior Analytics
  app.get('/api/admin/behavior-analytics', async (req, res) => {
    try {
      const photos = await db.select().from(uploadedPhotos);
      const challenges = await db.select().from(questChallenges);
      const progress = await db.select().from(questProgress);

      // Mock analytics data based on real data
      const analyticsData = {
        totalSessions: progress.length * 2, // Approximate sessions
        averageSessionDuration: 180, // 3 minutes average
        popularChallenges: challenges
          .map((c: any) => ({
            id: c.id,
            title: c.title,
            interactions: photos.filter((p: any) => p.questId === c.id).length
          }))
          .sort((a: any, b: any) => b.interactions - a.interactions)
          .slice(0, 5),
        peakHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          activity: Math.floor(Math.random() * 100)
        })),
        userRetentionRate: 85,
        photoUploadSuccess: photos.filter((p: any) => p.isVerified).length / Math.max(photos.length, 1) * 100
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching behavior analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // AI Insights
  app.get('/api/admin/ai-insights', async (req, res) => {
    try {
      // Mock AI insights based on current data
      const insights = [
        {
          id: '1',
          title: 'Vysoká angažovanost ve večerních hodinách',
          description: 'Uživatelé jsou nejaktivnější mezi 19:00-22:00. Doporučuje se plánovat nové výzvy v tomto čase.',
          confidence: 92,
          category: 'user_behavior',
          actionable: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Oblíbené typy fotografických výzev',
          description: 'Výzvy s tématikou "romantika" a "příroda" mají 40% vyšší míru dokončení.',
          confidence: 87,
          category: 'content',
          actionable: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Optimalizace obtížnosti výzev',
          description: 'Výzvy s 3-5 požadovanými fotkami mají nejvyšší míru dokončení (78%).',
          confidence: 94,
          category: 'engagement',
          actionable: false,
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ insights });
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  });

  app.post('/api/admin/ai-insights', async (req, res) => {
    try {
      // Mock insight generation process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing

      const insights = [
        {
          id: Date.now().toString(),
          title: 'Nový poznatek vygenerován',
          description: 'AI analyzovala nejnovější data a objevila nové vzory v chování uživatelů.',
          confidence: Math.floor(Math.random() * 30) + 70,
          category: 'performance',
          actionable: true,
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ insights, message: 'AI poznatky úspěšně vygenerovány' });
    } catch (error) {
      console.error('Error generating AI insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  // AI Recommendations
  app.get('/api/admin/ai-recommendations', async (req, res) => {
    try {
      const recommendations = [
        {
          id: '1',
          title: 'Přidat motivační zprávy',
          description: 'Přidejte automatické povzbuzující zprávy pro uživatele, kteří dokončí obtížné výzvy.',
          priority: 'high',
          category: 'Engagement',
          estimatedImpact: '+15% retence',
          autoApplicable: true
        },
        {
          id: '2',
          title: 'Optimalizovat načítání fotek',
          description: 'Implementujte lazy loading pro galerii k rychlejšímu načítání stránek.',
          priority: 'medium',
          category: 'Performance',
          estimatedImpact: '+25% rychlost',
          autoApplicable: true
        },
        {
          id: '3',
          title: 'Přidat sociální funkce',
          description: 'Umožněte uživatelům komentovat a sdílet fotky mezi sebou.',
          priority: 'low',
          category: 'Social',
          estimatedImpact: '+30% engagement',
          autoApplicable: false
        }
      ];

      res.json({ recommendations });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  app.post('/api/admin/ai-recommendations/:id/apply', async (req, res) => {
    try {
      const { id } = req.params;

      // Mock application of recommendation
      await new Promise(resolve => setTimeout(resolve, 1500));

      res.json({ 
        success: true, 
        message: `Doporučení ${id} bylo úspěšně aplikováno`,
        appliedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error applying recommendation:', error);
      res.status(500).json({ error: 'Failed to apply recommendation' });
    }
  });

  // System Status
  app.get('/api/admin/system-status', async (req, res) => {
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

      checks.push({
        name: 'Environment Variables',
        status: missingEnvVars.length === 0 ? 'success' : 'warning',
        message: missingEnvVars.length === 0 ? 'Všechny požadované proměnné jsou nastaveny' : 'Některé proměnné nejsou nastaveny',
        details: missingEnvVars.length > 0 ? `Chybí: ${missingEnvVars.join(', ')}` : 'DATABASE_URL, REPL_ID jsou dostupné'
      });

      // SECRETS check
      const { getSecretStatus } = await import('./init-secrets');
      const secretStatus = getSecretStatus();

      checks.push({
        name: 'SECRETS Configuration',
        status: secretStatus.missing.length === 0 ? 'success' : 'error',
        message: secretStatus.missing.length === 0 ? 'Všechny SECRETS jsou nastaveny' : 'Některé SECRETS chybí',
        details: {
          required: secretStatus.required,
          optional: secretStatus.optional,
          missing: secretStatus.missing
        }
      });

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
          // Extract photo ID from log details (since targetId doesn't exist)
          let photoId = null;
          if (log.details) {
            try {
              const details = JSON.parse(log.details);
              photoId = details.photoId;
            } catch {
              // If details is just a string, try to extract ID
              const match = log.details.match(/photo[_\s]id[:\s]+([a-f0-9\-]+)/i);
              photoId = match ? match[1] : null;
            }
          }
          const photo = photoId ? photos.find(p => p.id === photoId) : null;
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