#!/usr/bin/env node

/**
 * Import všech dat do nové Wedding Website aplikace
 * Tento script importuje databázová data, fotky a secrets
 * z exportu původní aplikace
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Kontrola argumentů
if (process.argv.length < 3) {
  console.error('❌ Použití: node scripts/import-data.js <export-file.json>');
  console.error('   Příklad: node scripts/import-data.js exports/wedding-data-export-2025-09-04.json');
  process.exit(1);
}

const exportFile = process.argv[2];

if (!fs.existsSync(exportFile)) {
  console.error(`❌ Export soubor nenalezen: ${exportFile}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL není nastavena pro cílovou databázi');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function importData() {
  console.log('🔄 Začínám import dat...');
  console.log(`📁 Soubor: ${exportFile}`);
  
  try {
    // Načtení exportu
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    console.log(`📊 Export z: ${exportData.metadata.exportDate}`);
    console.log(`📝 Verze: ${exportData.metadata.version}`);
    console.log('');

    // Upozornění na SECRETS
    console.log('🔐 SECRETS CONFIG:');
    console.log('Pro správnou funkci aplikace nastavte následující environment variables:');
    console.log('');
    for (const [key, value] of Object.entries(exportData.secrets)) {
      console.log(`${key}=${value}`);
    }
    console.log('');
    console.log('💡 TIP: Zkopírujte výše uvedené řádky do Secrets tab v Replit');
    console.log('');

    // Import databázových dat
    console.log('📊 Importuji databázová data...');
    
    // Users
    if (exportData.database.users && exportData.database.users.length > 0) {
      console.log('🔄 Importuji users...');
      for (const user of exportData.database.users) {
        await sql`
          INSERT INTO users (id, email, first_name, last_name, profile_image_url, password_hash, is_admin, created_at, updated_at)
          VALUES (${user.id}, ${user.email}, ${user.firstName}, ${user.lastName}, ${user.profileImageUrl}, ${user.passwordHash}, ${user.isAdmin}, ${user.createdAt}, ${user.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            profile_image_url = EXCLUDED.profile_image_url,
            is_admin = EXCLUDED.is_admin,
            updated_at = EXCLUDED.updated_at
        `;
      }
      console.log(`✅ Users: ${exportData.database.users.length} importováno`);
    }

    // Quest challenges
    if (exportData.database.questChallenges && exportData.database.questChallenges.length > 0) {
      console.log('🔄 Importuji quest challenges...');
      for (const challenge of exportData.database.questChallenges) {
        await sql`
          INSERT INTO quest_challenges (id, title, description, target_photos, points, is_active, unlock_date, unlock_order, created_at)
          VALUES (${challenge.id}, ${challenge.title}, ${challenge.description}, ${challenge.targetPhotos}, ${challenge.points}, ${challenge.isActive}, ${challenge.unlockDate}, ${challenge.unlockOrder}, ${challenge.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            target_photos = EXCLUDED.target_photos,
            points = EXCLUDED.points,
            is_active = EXCLUDED.is_active,
            unlock_date = EXCLUDED.unlock_date,
            unlock_order = EXCLUDED.unlock_order
        `;
      }
      console.log(`✅ Quest challenges: ${exportData.database.questChallenges.length} importováno`);
    }

    // Uploaded photos
    if (exportData.database.uploadedPhotos && exportData.database.uploadedPhotos.length > 0) {
      console.log('🔄 Importuji uploaded photos...');
      for (const photo of exportData.database.uploadedPhotos) {
        await sql`
          INSERT INTO uploaded_photos (
            id, filename, original_name, mime_type, size, uploader_name, quest_id, likes, 
            is_verified, verification_score, ai_analysis, technical_quality, detected_objects,
            wedding_elements, atmosphere, people_count, location, emotions, category, tags, 
            creative_tips, created_at
          )
          VALUES (
            ${photo.id}, ${photo.filename}, ${photo.originalName}, ${photo.mimeType}, ${photo.size},
            ${photo.uploaderName}, ${photo.questId}, ${photo.likes}, ${photo.isVerified},
            ${photo.verificationScore}, ${photo.aiAnalysis}, ${JSON.stringify(photo.technicalQuality)},
            ${JSON.stringify(photo.detectedObjects)}, ${JSON.stringify(photo.weddingElements)},
            ${photo.atmosphere}, ${photo.peopleCount}, ${photo.location}, ${JSON.stringify(photo.emotions)},
            ${photo.category}, ${JSON.stringify(photo.tags)}, ${photo.creativeTips}, ${photo.createdAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            likes = EXCLUDED.likes,
            is_verified = EXCLUDED.is_verified,
            verification_score = EXCLUDED.verification_score,
            ai_analysis = EXCLUDED.ai_analysis
        `;
      }
      console.log(`✅ Uploaded photos: ${exportData.database.uploadedPhotos.length} importováno`);
    }

    // Photo comments
    if (exportData.database.photoComments && exportData.database.photoComments.length > 0) {
      console.log('🔄 Importuji photo comments...');
      for (const comment of exportData.database.photoComments) {
        await sql`
          INSERT INTO photo_comments (id, photo_id, commenter_email, commenter_name, content, created_at)
          VALUES (${comment.id}, ${comment.photoId}, ${comment.commenterEmail}, ${comment.commenterName}, ${comment.content}, ${comment.createdAt})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Photo comments: ${exportData.database.photoComments.length} importováno`);
    }

    // Photo likes
    if (exportData.database.photoLikes && exportData.database.photoLikes.length > 0) {
      console.log('🔄 Importuji photo likes...');
      for (const like of exportData.database.photoLikes) {
        await sql`
          INSERT INTO photo_likes (id, photo_id, voter_name, created_at)
          VALUES (${like.id}, ${like.photoId}, ${like.voterName}, ${like.createdAt})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Photo likes: ${exportData.database.photoLikes.length} importováno`);
    }

    // Quest progress
    if (exportData.database.questProgress && exportData.database.questProgress.length > 0) {
      console.log('🔄 Importuji quest progress...');
      for (const progress of exportData.database.questProgress) {
        await sql`
          INSERT INTO quest_progress (id, quest_id, participant_name, photos_uploaded, is_completed, completed_at, created_at)
          VALUES (${progress.id}, ${progress.questId}, ${progress.participantName}, ${progress.photosUploaded}, ${progress.isCompleted}, ${progress.completedAt}, ${progress.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            photos_uploaded = EXCLUDED.photos_uploaded,
            is_completed = EXCLUDED.is_completed,
            completed_at = EXCLUDED.completed_at
        `;
      }
      console.log(`✅ Quest progress: ${exportData.database.questProgress.length} importováno`);
    }

    // Mini games
    if (exportData.database.miniGames && exportData.database.miniGames.length > 0) {
      console.log('🔄 Importuji mini games...');
      for (const game of exportData.database.miniGames) {
        await sql`
          INSERT INTO mini_games (id, title, description, game_type, game_data, points, time_limit, is_active, created_at)
          VALUES (${game.id}, ${game.title}, ${game.description}, ${game.gameType}, ${JSON.stringify(game.gameData)}, ${game.points}, ${game.timeLimit}, ${game.isActive}, ${game.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            game_data = EXCLUDED.game_data,
            points = EXCLUDED.points,
            time_limit = EXCLUDED.time_limit,
            is_active = EXCLUDED.is_active
        `;
      }
      console.log(`✅ Mini games: ${exportData.database.miniGames.length} importováno`);
    }

    // Mini game scores
    if (exportData.database.miniGameScores && exportData.database.miniGameScores.length > 0) {
      console.log('🔄 Importuji mini game scores...');
      for (const score of exportData.database.miniGameScores) {
        await sql`
          INSERT INTO mini_game_scores (id, game_id, player_name, score, time_taken, is_completed, created_at)
          VALUES (${score.id}, ${score.gameId}, ${score.playerName}, ${score.score}, ${score.timeTaken}, ${score.isCompleted}, ${score.createdAt})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Mini game scores: ${exportData.database.miniGameScores.length} importováno`);
    }

    // Info o uploadeých souborech
    console.log('📂 Info o nahraných souborech:');
    if (exportData.uploadedFiles && exportData.uploadedFiles.length > 0) {
      console.log(`📋 Celkem souborů v původním projektu: ${exportData.uploadedFiles.length}`);
      console.log('💡 DŮLEŽITÉ: Zkopírujte ručně uploads/ složku z původního projektu!');
      console.log('   1. Stáhněte celou uploads/ složku z původního projektu');
      console.log('   2. Nahrajte ji do nového projektu');
      console.log('   3. Ujistěte se, že má správná oprávnění');
    } else {
      console.log('📋 Žádné soubory k přenosu');
    }

    console.log('');
    console.log('🎉 Import dokončen!');
    console.log('');
    console.log('📋 Další kroky:');
    console.log('1. ✅ Nastavte SECRETS v Replit (viz výše)');
    console.log('2. 📂 Zkopírujte uploads/ složku');
    console.log('3. 🔄 Restartujte aplikaci');
    console.log('4. 🧪 Otestujte funkcionality');
    console.log('');

  } catch (error) {
    console.error('❌ Chyba při importu:', error);
    process.exit(1);
  }
}

// Spuštění importu
if (require.main === module) {
  importData().catch(console.error);
}

module.exports = { importData };