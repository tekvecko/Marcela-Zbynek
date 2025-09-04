# 🚀 Wedding Website - Průvodce migrace dat

Tento průvodce vám pomůže přenést všechna data (fotky, uživatele, komentáře, progress, atd.) z původního projektu do nového remixovaného projektu.

## 📋 Co se přenáší

### 🗄️ Databázová data
- **Uživatelé** - všechny registrované účty
- **Fotovýzvy** - všechny definované challenges
- **Fotky** - metadata všech nahraných fotek
- **Komentáře** - všechny komentáře k fotkám
- **Lajky** - všechna hodnocení fotek
- **Progress** - pokrok uživatelů v jednotlivých výzvách
- **Mini-hry** - všechny dostupné mini-hry
- **Skóre** - výsledky ze všech mini-her

### 🔐 Secrets (Environment Variables)
- `DATABASE_URL` - připojení k databázi
- `GEMINI_API_KEY` - AI analýza fotek
- `JWT_SECRET` - autentifikace
- `SESSION_SECRET` - session management
- `ADMIN_EMAIL` - admin účet
- `REPLIT_AGENT_API_KEY` - Replit integrace

### 📂 Soubory
- **Uploads složka** - všechny nahrané fotky (fyzické soubory)

## 🔄 Proces migrace

### Krok 1: Export z původního projektu

1. **Otevřete původní projekt** v Replit
2. **Spusťte export script**:
   ```bash
   cd scripts
   npm install
   node export-data.js
   ```

3. **Export vytvoří**:
   - JSON soubor s všemi daty: `exports/wedding-data-export-[timestamp].json`
   - Seznam nahraných souborů k přenosu

4. **Stáhněte export soubor** z exports/ složky
5. **Stáhněte celou uploads/ složku** (nebo zkomprimujte jako ZIP)

### Krok 2: Příprava nového projektu

1. **Remixujte Wedding Website projekt**
2. **Vytvořte novou Neon databázi** (nebo použijte existující)
3. **Zkopírujte scripts/ složku** do nového projektu (pokud již není)

### Krok 3: Import do nového projektu

1. **Nahrajte export soubor** do exports/ složky nového projektu
2. **Nahrajte uploads/ složku** do root složky nového projektu

3. **Spusťte import script**:
   ```bash
   cd scripts
   npm install
   node import-data.js ../exports/wedding-data-export-[timestamp].json
   ```

### Krok 4: Konfigurace Secrets

Import script zobrazí všechny potřebné environment variables. Zkopírujte je do **Secrets tab** v Replit:

```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
JWT_SECRET=...
SESSION_SECRET=...
ADMIN_EMAIL=marcelazbynek@gmail.com
```

### Krok 5: Finalizace

1. **Restartujte aplikaci** (Run button)
2. **Otestujte funkcionality**:
   - Přihlášení existujících uživatelů
   - Zobrazení fotek v galerii
   - Funkcionality komentářů a lajků
   - Progress v photo quest
   - Mini-hry a leaderboardy

## 🛠️ Utility skripty

### Export dat
```bash
node scripts/export-data.js
```

### Import dat
```bash
node scripts/import-data.js exports/wedding-data-export-[timestamp].json
```

### Kopírování uploads složky (pomocný)
```bash
node scripts/copy-uploads.js /path/to/old/uploads ./uploads
```

## ✅ Checklist migrace

### Před exportem
- [ ] Ověřte, že původní aplikace běží bez chyb
- [ ] Zkontrolujte, že máte admin přístup
- [ ] Ujistěte se, že DATABASE_URL je správně nastavena

### Export
- [ ] Spusťte export script
- [ ] Stáhněte export JSON soubor
- [ ] Stáhněte/zkomprimujte uploads/ složku
- [ ] Poznamenejte si timestamp exportu

### Import
- [ ] Vytvořte/připravte novou databázi
- [ ] Nahrajte export soubor do nového projektu
- [ ] Nahrajte uploads/ složku
- [ ] Spusťte import script
- [ ] Zkonfigurujte všechny secrets

### Testování
- [ ] Restartujte aplikaci
- [ ] Otestujte přihlášení
- [ ] Zkontrolujte zobrazení fotek
- [ ] Ověřte komentáře a lajky
- [ ] Otestujte admin panel (pokud máte admin přístup)
- [ ] Ověřte funkčnost všech photo challenges

## 🔧 Řešení problémů

### Export selhal
- Zkontrolujte DATABASE_URL
- Ověřte oprávnění k databázi
- Zkontrolujte dostupnost Neon databáze

### Import selhal
- Ověřte formát export souboru
- Zkontrolujte target DATABASE_URL
- Ujistěte se, že cílová databáze je prázdná nebo připravená

### Chybí fotky
- Zkontrolujte, že uploads/ složka byla správně zkopírována
- Ověřte oprávnění složky (755)
- Zkontrolujte, že názvy souborů odpovídají databázovým záznamům

### Nefunguje přihlášení
- Zkontrolujte JWT_SECRET a SESSION_SECRET
- Ověřte, že user data byla správně importována
- Restartujte aplikaci po nastavení secrets

## 📞 Podpora

Pokud narazíte na problémy:

1. **Zkontrolujte logy** aplikace pro chybové zprávy
2. **Ověřte database struktur** - ujistěte se, že odpovídá schema.ts
3. **Kontaktujte autora** s detailním popisem problému

---

💡 **TIP**: Doporučujeme provést test migrace na kopii dat před finální migrací produkčních dat.