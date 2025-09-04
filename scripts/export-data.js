#!/usr/bin/env node

/**
 * Export všech dat z Wedding Website aplikace
 * Tento script exportuje všechna databázová data, fotky a secrets
 * pro možnost přenosu do nové remixované aplikace
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Kontrola environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL není nastavena');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function exportData() {
  console.log('🔄 Začínám export dat...');
  
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      description: 'Wedding Website - Complete Data Export'
    },
    database: {},
    secrets: {},
    uploadedFiles: []
  };

  try {
    // Export databázových tabulek
    console.log('📊 Exportuji databázová data...');
    
    // Users (bez session dat)
    const users = await sql`SELECT * FROM users`;
    exportData.database.users = users;
    console.log(`✅ Users: ${users.length} záznamů`);
    
    // Quest challenges
    const questChallenges = await sql`SELECT * FROM quest_challenges`;
    exportData.database.questChallenges = questChallenges;
    console.log(`✅ Quest challenges: ${questChallenges.length} záznamů`);
    
    // Uploaded photos
    const uploadedPhotos = await sql`SELECT * FROM uploaded_photos`;
    exportData.database.uploadedPhotos = uploadedPhotos;
    console.log(`✅ Uploaded photos: ${uploadedPhotos.length} záznamů`);
    
    // Photo comments
    const photoComments = await sql`SELECT * FROM photo_comments`;
    exportData.database.photoComments = photoComments;
    console.log(`✅ Photo comments: ${photoComments.length} záznamů`);
    
    // Photo likes
    const photoLikes = await sql`SELECT * FROM photo_likes`;
    exportData.database.photoLikes = photoLikes;
    console.log(`✅ Photo likes: ${photoLikes.length} záznamů`);
    
    // Quest progress
    const questProgress = await sql`SELECT * FROM quest_progress`;
    exportData.database.questProgress = questProgress;
    console.log(`✅ Quest progress: ${questProgress.length} záznamů`);
    
    // Mini games
    const miniGames = await sql`SELECT * FROM mini_games`;
    exportData.database.miniGames = miniGames;
    console.log(`✅ Mini games: ${miniGames.length} záznamů`);
    
    // Mini game scores
    const miniGameScores = await sql`SELECT * FROM mini_game_scores`;
    exportData.database.miniGameScores = miniGameScores;
    console.log(`✅ Mini game scores: ${miniGameScores.length} záznamů`);

    // Export secrets/environment variables
    console.log('🔐 Exportuji SECRETS...');
    const secretKeys = [
      'DATABASE_URL',
      'GEMINI_API_KEY',
      'JWT_SECRET',
      'SESSION_SECRET',
      'ADMIN_EMAIL',
      'REPLIT_AGENT_API_KEY'
    ];
    
    for (const key of secretKeys) {
      if (process.env[key]) {
        exportData.secrets[key] = process.env[key];
        console.log(`✅ ${key}: [HIDDEN]`);
      } else {
        console.log(`⚠️  ${key}: není nastaveno`);
      }
    }

    // Export uploaded files list
    console.log('📂 Mapuji nahrané soubory...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      exportData.uploadedFiles = files.map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      });
      console.log(`✅ Mapped files: ${files.length} souborů`);
    } else {
      console.log('⚠️  Uploads složka neexistuje');
    }

    // Uložení exportu
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(exportDir, `wedding-data-export-${timestamp}.json`);
    
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log('🎉 Export dokončen!');
    console.log(`📁 Soubor: ${exportFile}`);
    console.log(`📊 Celková velikost: ${Math.round(fs.statSync(exportFile).size / 1024)}KB`);
    console.log('');
    console.log('📋 Následující kroky pro přenos dat:');
    console.log('1. Stáhněte export soubor');
    console.log('2. Zkopírujte celou uploads/ složku');
    console.log('3. V novém projektu spusťte: node scripts/import-data.js <export-file>');
    console.log('');
    
    return exportFile;
    
  } catch (error) {
    console.error('❌ Chyba při exportu:', error);
    process.exit(1);
  }
}

// Spuštění exportu
if (require.main === module) {
  exportData().catch(console.error);
}

module.exports = { exportData };