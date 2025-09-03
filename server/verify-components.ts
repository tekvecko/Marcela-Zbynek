
export async function verifyAllComponents(): Promise<boolean> {
  console.log("🔍 Kontroluji všechny komponenty aplikace...");
  
  const fs = await import('fs');
  const path = await import('path');
  
  const criticalFiles = [
    // Client komponenty
    'client/src/App.tsx',
    'client/src/main.tsx',
    'client/src/pages/home.tsx',
    'client/src/pages/photo-quest.tsx',
    'client/src/pages/gallery.tsx',
    'client/src/pages/challenge.tsx',
    'client/src/pages/details.tsx',
    'client/src/pages/admin.tsx',
    'client/src/pages/login.tsx',
    'client/src/pages/profile.tsx',
    'client/src/pages/mini-games.tsx',
    'client/src/pages/leaderboards.tsx',
    
    // Client komponenty UI
    'client/src/components/photo-gallery.tsx',
    'client/src/components/navigation.tsx',
    'client/src/components/auth-form.tsx',
    'client/src/components/photo-quest.tsx',
    
    // Server komponenty
    'server/routes.ts',
    'server/storage.ts',
    'server/gemini.ts',
    'server/db.ts',
    'server/init-challenges.ts',
    'server/init-mini-games.ts',
    
    // Shared schema
    'shared/schema.ts',
    
    // Config files
    'package.json',
    'vite.config.ts',
    'tailwind.config.ts'
  ];
  
  const missingFiles: string[] = [];
  const existingFiles: string[] = [];
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  console.log(`✅ Nalezeno ${existingFiles.length} kritických souborů`);
  
  if (missingFiles.length > 0) {
    console.log("⚠️  Chybějící soubory:");
    missingFiles.forEach(file => console.log(`   - ${file}`));
    
    // Pokus o obnovu kritických souborů
    if (missingFiles.includes('client/src/App.tsx')) {
      console.log("🔧 App.tsx chybí - aplikace nebude fungovat");
      return false;
    }
    
    return missingFiles.length < criticalFiles.length / 2; // Toleruj do 50% chybějících souborů
  }
  
  console.log("🎉 Všechny kritické komponenty jsou na místě!");
  return true;
}

export async function ensureDirectories(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredDirs = [
    'uploads',
    'client/src/components',
    'client/src/pages', 
    'client/src/contexts',
    'server/middleware',
    'server/utils',
    'shared'
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Vytvořena složka: ${dir}`);
    }
  }
}
