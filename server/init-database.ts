import { db } from "./db";

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Database initialization is handled by db.ts
    // This function is kept for compatibility but the actual initialization
    // happens in the database connection setup
    
    console.log("✅ Database initialization completed successfully");

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}