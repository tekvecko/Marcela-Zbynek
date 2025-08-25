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

// Funkce pro vytvoření databázového připojení s health check
async function createDatabaseConnectionWithHealthCheck(): Promise<DatabaseConnection> {
  const connections = [
    {
      name: 'Neon',
      url: process.env.DATABASE_URL,
      condition: (url: string) => url?.includes('neon.tech'),
      createPool: (url: string) => new Pool({ connectionString: url }),
      createDb: (pool: Pool) => drizzle({ client: pool, schema })
    },
    {
      name: 'Replit PostgreSQL', 
      url: process.env.DATABASE_URL,
      condition: (url: string) => url && !url.includes('neon.tech'),
      createPool: (url: string) => new NodePool({ connectionString: url }),
      createDb: (pool: NodePool) => drizzleNode(pool, { schema })
    },
    {
      name: 'Supabase',
      url: process.env.SUPABASE_DATABASE_URL,
      condition: (url: string) => !!url,
      createPool: (url: string) => new NodePool({ 
        connectionString: url,
        ssl: { rejectUnauthorized: false }
      }),
      createDb: (pool: NodePool) => drizzleNode(pool, { schema })
    }
  ];

  for (const config of connections) {
    if (!config.url || !config.condition(config.url)) continue;
    
    console.log(`🔗 Zkouším připojení k ${config.name}...`);
    try {
      const pool = config.createPool(config.url);
      const db = config.createDb(pool);
      
      // Health check
      await db.execute('SELECT 1');
      console.log(`✅ Úspěšně připojen k ${config.name}`);
      
      return { pool, db, name: config.name };
    } catch (error) {
      console.warn(`⚠️ ${config.name} nedostupný:`, error.message);
      continue;
    }
  }

  console.log("⚠️ Žádná databáze není dostupná - používám in-memory storage");
  return { pool: null, db: null, name: 'In-Memory' };
}

// Synchronní wrapper pro zpětnou kompatibilitu
function createDatabaseConnection(): DatabaseConnection {
  // Pro inicializaci použijeme první dostupnou databázi
  if (process.env.DATABASE_URL) {
    console.log("🔗 Připojuji se k primární databázi...");
    try {
      if (process.env.DATABASE_URL.includes('neon.tech')) {
        const neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
        const neonDb = drizzle({ client: neonPool, schema });
        return { pool: neonPool, db: neonDb, name: 'Neon' };
      } else {
        const nodePool = new NodePool({ connectionString: process.env.DATABASE_URL });
        const nodeDb = drizzleNode(nodePool, { schema });
        return { pool: nodePool, db: nodeDb, name: 'Replit PostgreSQL' };
      }
    } catch (error) {
      console.warn("⚠️ Chyba při připojování k primární databázi:", error.message);
    }
  }

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
      console.warn("⚠️ Chyba při připojování k záložní databázi:", error.message);
    }
  }

  console.log("⚠️ Žádná databáze není dostupná - aplikace bude používat in-memory storage");
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

// Funkce pro automatické přepnutí na záložní databázi
export async function switchToFallbackDatabase(): Promise<boolean> {
  console.log('🔄 Přepínám na záložní databázi...');
  
  try {
    const newConnection = await createDatabaseConnectionWithHealthCheck();
    
    if (newConnection.db && newConnection.name !== dbName) {
      // Aktualizuj globální proměnné
      Object.assign(exports, {
        pool: newConnection.pool,
        db: newConnection.db,
        dbName: newConnection.name
      });
      
      console.log(`✅ Úspěšně přepnuto na ${newConnection.name}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Nepodařilo se přepnout na záložní databázi:', error);
    return false;
  }
}

// Periodické ověření dostupnosti databáze
export function startDatabaseHealthMonitoring() {
  setInterval(async () => {
    const isHealthy = await testDatabaseConnection();
    if (!isHealthy) {
      console.log('🚨 Databáze nedostupná, zkouším záložní...');
      await switchToFallbackDatabase();
    }
  }, 30000); // Kontrola každých 30 sekund
}