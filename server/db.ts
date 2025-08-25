import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
neonConfig.ssl = false; // Disable SSL verification for development

interface DatabaseConnection {
  pool: Pool | NodePool | null;
  db: any;
  name: string;
}

// Funkce pro vytvoření databázového připojení
function createDatabaseConnection(): DatabaseConnection {
  // 1. Pokus o primární databázi (Neon/Replit)
  if (process.env.DATABASE_URL) {
    console.log("🔗 Připojuji se k primární databázi (Neon/Replit)...");
    try {
      if (process.env.DATABASE_URL.includes('neon.tech')) {
        // Neon databáze
        const neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
        const neonDb = drizzle({ client: neonPool, schema });
        return { pool: neonPool, db: neonDb, name: 'Neon' };
      } else {
        // Jiná PostgreSQL databáze (Replit)
        const nodePool = new NodePool({ connectionString: process.env.DATABASE_URL });
        const nodeDb = drizzleNode(nodePool, { schema });
        return { pool: nodePool, db: nodeDb, name: 'Replit PostgreSQL' };
      }
    } catch (error) {
      console.warn("⚠️  Chyba při připojování k primární databázi:", error.message);
    }
  }

  // 2. Pokus o záložní databázi (Supabase)
  if (process.env.SUPABASE_DATABASE_URL) {
    console.log("🔗 Připojuji se k záložní databázi (Supabase)...");
    try {
      const supabasePool = new NodePool({ 
        connectionString: process.env.SUPABASE_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const supabaseDb = drizzleNode(supabasePool, { schema });
      return { pool: supabasePool, db: supabaseDb, name: 'Supabase' };
    } catch (error) {
      console.warn("⚠️  Chyba při připojování k záložní databázi:", error.message);
    }
  }

  // 3. Pokud žádná databáze není dostupná
  console.log("⚠️  Žádná databáze není dostupná - aplikace bude používat in-memory storage");
  console.log("💡 Nastavte DATABASE_URL nebo SUPABASE_DATABASE_URL pro persistentní databázi");
  
  return { pool: null, db: null, name: 'In-Memory' };
}

// Vytvoř připojení
const connection = createDatabaseConnection();

export const pool = connection.pool;
export const db = connection.db;
export const dbName = connection.name;

// Funkce pro testování připojení
export async function testDatabaseConnection(): Promise<boolean> {
  if (!db) return false;
  
  try {
    // Jednoduchý test query
    await db.execute('SELECT 1');
    console.log(`✅ Databázové připojení k ${dbName} je funkční`);
    return true;
  } catch (error) {
    console.error(`❌ Databázové připojení k ${dbName} selhalo:`, error.message);
    return false;
  }
}