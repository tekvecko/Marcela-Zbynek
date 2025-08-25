import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
neonConfig.ssl = false; // Disable SSL verification for development

if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL není nastavena - aplikace bude používat in-memory storage");
  console.log("💡 Pro persistentní databázi si můžete vytvořit externí PostgreSQL databázi");
}

// Export pouze pokud je DATABASE_URL dostupná
export const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = process.env.DATABASE_URL ? drizzle({ client: pool, schema }) : null;