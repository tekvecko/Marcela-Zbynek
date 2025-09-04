#!/usr/bin/env node

/**
 * Pomocný script pro kopírování uploads složky
 * Tento script pomáhá s přenosem uploaded souborů mezi projekty
 */

const fs = require('fs');
const path = require('path');

function copyUploads(sourceDir, targetDir) {
  console.log('📂 Kopíruji uploaded soubory...');
  console.log(`📁 Zdroj: ${sourceDir}`);
  console.log(`📁 Cíl: ${targetDir}`);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Zdrojová složka neexistuje: ${sourceDir}`);
    return false;
  }
  
  // Vytvoření cílové složky
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✅ Vytvořena cílová složka: ${targetDir}`);
  }
  
  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;
  let totalSize = 0;
  
  for (const filename of files) {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      const size = fs.statSync(targetPath).size;
      totalSize += size;
      copiedCount++;
      
      if (copiedCount % 10 === 0) {
        console.log(`📋 Zkopírováno: ${copiedCount}/${files.length} souborů`);
      }
    }
  }
  
  console.log(`✅ Kopírování dokončeno!`);
  console.log(`📊 Zkopírováno: ${copiedCount} souborů`);
  console.log(`📏 Celková velikost: ${Math.round(totalSize / 1024 / 1024)}MB`);
  
  return true;
}

// Použití z příkazové řádky
if (require.main === module) {
  if (process.argv.length < 4) {
    console.error('❌ Použití: node copy-uploads.js <source-uploads-dir> <target-uploads-dir>');
    console.error('   Příklad: node copy-uploads.js /path/to/old/uploads /path/to/new/uploads');
    process.exit(1);
  }
  
  const sourceDir = process.argv[2];
  const targetDir = process.argv[3];
  
  copyUploads(sourceDir, targetDir);
}

module.exports = { copyUploads };