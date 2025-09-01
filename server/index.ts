import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDefaultChallenges } from "./init-challenges";
import { initializeDefaultMiniGames } from "./init-mini-games";
import { authenticateUser as authenticateToken } from "./middleware/auth";
import { testDatabaseConnection, dbName, startDatabaseHealthMonitoring } from "./db";
import { initializeDatabase } from "./init-database";
import { initializeSecrets } from "./init-secrets";
import { storage } from "./storage";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

// Initialize database on startup
initializeDatabase().catch(console.error);

// Security headers middleware
app.use((req, res, next) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://replit.com https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'"
  ].join('; '));

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only log response data in development and sanitize sensitive data
      if (capturedJsonResponse && process.env.NODE_ENV === 'development') {
        const sanitizedResponse = { ...capturedJsonResponse };

        // Remove sensitive fields from logs
        if (sanitizedResponse.email) sanitizedResponse.email = '***@***.***';
        if (sanitizedResponse.access_token) sanitizedResponse.access_token = '[REDACTED]';
        if (sanitizedResponse.refresh_token) sanitizedResponse.refresh_token = '[REDACTED]';
        if (sanitizedResponse.id && sanitizedResponse.id.length > 10) {
          sanitizedResponse.id = sanitizedResponse.id.substring(0, 6) + '***';
        }

        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Zkontroluj a inicializuj SECRETS
  const secretsReady = await initializeSecrets();
  if (!secretsReady) {
    console.log("❌ Server se nespustí bez povinných SECRETS");
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // Test databázového připojení
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log(`🗄️  Databáze (${dbName}) je připravena`);
  } else {
    console.log("🗄️  Databáze není dostupná, používám in-memory storage");
  }

  // Spustit monitoring databáze pro automatické přepínání
  startDatabaseHealthMonitoring();

  // Inicializuj výchozí fotovýzvy a mini-hry
  try {
    await initializeDefaultChallenges();
    await initializeDefaultMiniGames();
  } catch (error) {
    console.log("⚠️  Inicializace se nezdařila, aplikace bude fungovat s omezenou funkcionalitou");
  }

  // Added for handling quest challenges route with logging
  // Note: 'storage' and 'authenticateToken' are assumed to be defined elsewhere in routes.ts
  // and are not included here as per the provided original code.
  app.get("/api/quest-challenges", authenticateToken, async (req, res) => {
    try {
      console.log('🔍 API: Načítám quest challenges...');
      const challenges = await storage.getQuestChallenges();
      console.log(`✅ API: Vrací ${challenges.length} výzev`);
      res.json(challenges);
    } catch (error) {
      console.error("❌ API: Chyba při načítání quest challenges:", error);
      res.status(500).json({ error: "Failed to get quest challenges" });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();