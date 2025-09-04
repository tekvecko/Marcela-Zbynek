# 🚀 Wedding Website - Migration Scripts

Tyto skripty umožňují export a import všech dat mezi projekty při remixování.

## 📋 Rychlé použití

### Export dat z původního projektu
```bash
cd scripts
npm install
node export-data.js
```

### Import dat do nového projektu
```bash
cd scripts
npm install
node import-data.js ../exports/wedding-data-export-[timestamp].json
```

### Kopírování uploads složky
```bash
cd scripts
node copy-uploads.js /path/to/old/uploads ../uploads
```

## 📁 Vytvořené soubory

- `export-data.js` - Export všech databázových dat a secrets
- `import-data.js` - Import dat do nové aplikace
- `copy-uploads.js` - Pomocník pro kopírování souborů
- `package.json` - Dependencies pro skripty

## 📖 Kompletní návod

Viz hlavní `MIGRATION.md` v root složce projektu pro detailní postup migrace.