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
import { initializeAdminUser } from "./init-admin-user";
import { initializeQuestChallenges } from "./init-challenges";
import { initializeMiniGames } from "./init-mini-games";
import * as miniGamesStorage from "./mini-games-storage";

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

  // Ověř komponenty před inicializací
  const { verifyAllComponents } = await import("./verify-components");
  const componentsReady = await verifyAllComponents();
  
  if (!componentsReady) {
    console.log("⚠️  Některé komponenty chybí, pokračuji s omezenou funkcionalitou");
  }

  // Inicializuj výchozí fotovýzvy a mini-hry
  try {
    await initializeDefaultChallenges();
    console.log("✅ Fotovýzvy inicializovány");
    await initializeDefaultMiniGames();
    console.log("✅ Mini-hry inicializovány");
  } catch (error) {
    console.error("❌ Chyba při inicializaci:", error);
    console.log("⚠️  Inicializace se nezdařila, aplikace bude fungovat s omezenou funkcionalitou");
  }

  // Kompletní verifikace inicializace
  await verifyInitialization();


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

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

  server.listen(port, host, () => {
    console.log(`8:39:08 PM [express] serving on port ${port}`);
  });
})();

async function verifyInitialization() {
  console.log("🔍 Ověřuji kompletnost inicializace...");

  const issues = [];

  try {
    // Check database connection
    const challengesCount = await storage.getQuestChallenges();
    if (challengesCount.length === 0) {
      issues.push("❌ Žádné fotovýzvy v databázi");
    } else {
      console.log(`✅ Fotovýzvy: ${challengesCount.length} načteno`);
    }

    // Check mini games
    const gamesCount = await miniGamesStorage.getAllMiniGames();
    if (gamesCount.length === 0) {
      issues.push("❌ Žádné mini-hry v databázi");
    } else {
      console.log(`✅ Mini-hry: ${gamesCount.length} načteno`);
    }

    // Check admin user
    const adminEmail = process.env.ADMIN_EMAIL || `${process.env.REPL_OWNER}@admin.local`;
    const adminUser = await storage.getAuthUserByEmail(adminEmail);
    if (!adminUser) {
      issues.push("❌ Admin uživatel neexistuje");
    } else {
      console.log(`✅ Admin uživatel: ${adminEmail}`);
    }

    // Check upload directory
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("✅ Upload složka vytvořena");
    } else {
      console.log("✅ Upload složka existuje");
    }

    // Check client build
    const clientDir = path.join(process.cwd(), 'client');
    if (!fs.existsSync(clientDir)) {
      issues.push("❌ Client složka neexistuje");
    } else {
      console.log("✅ Client aplikace je dostupná");
    }

    if (issues.length > 0) {
      console.log("\n⚠️  Nalezeny problémy při inicializaci:");
      issues.forEach(issue => console.log(issue));
      console.log("\n🔧 Pokračuji ve spuštění, ale některé funkce nemusí fungovat...");
    } else {
      console.log("\n🎉 Všechny komponenty úspěšně inicializovány!");
      console.log("📱 Aplikace je připravena k použití");
    }

  } catch (error) {
    console.error("❌ Chyba při verifikaci inicializace:", error);
    console.log("🔧 Pokračuji ve spuštění s možnými omezeními...");
  }
}