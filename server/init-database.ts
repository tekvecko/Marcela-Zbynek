
import { db } from "./db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Run migrations
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const migrationDb = drizzle(migrationClient);
    
    await migrate(migrationDb, { migrationsFolder: "./migrations" });
    await migrationClient.end();
    
    console.log("✅ Database migrations completed successfully");
    
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}

// Auto-run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
