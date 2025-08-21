# 🚀 Návod k nastavení Wedding Photo Quest

## 1. Remixování projektu

1. Klikněte na **"Fork"** nebo **"Remix"** tlačítko
2. Vyčkejte, než se projekt nakopíruje do vašeho Replit účtu
3. Projekt se automaticky spustí

## 2. Nastavení API klíčů (povinné)

### Google Gemini AI API

Aplikace potřebuje Google Gemini API klíč pro automatické ověřování fotografií:

1. **Získejte API klíč**:
   - Jděte na [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Přihlaste se Google účtem
   - Klikněte "Create API Key"
   - Zkopírujte vygenerovaný klíč

2. **Nastavte v Replitu**:
   - Otevřete záložku "Secrets" (🔒) v levém panelu
   - Klikněte "New Secret"
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Vložte váš API klíč
   - Klikněte "Add Secret"

## 3. Automatické spuštění

Po nastavení API klíče:

1. **Restartujte aplikaci** - klikněte "Stop" a pak "Run"
2. **Počkejte na spuštění** - aplikace se spustí na portu 5000
3. **Automatická inicializace** - při prvním spuštění se vytvoří:
   - 37 přednastavených fotografických výzev
   - Databázové tabulky
   - Defaultní admin účet

## 4. Nastavení admin účtu

Pro přístup k admin panelu:

1. **Registrujte se** jako první uživatel
2. **Otevřete Database** záložku v Replitu
3. **Spusťte SQL dotaz**:
   ```sql
   UPDATE users SET "isAdmin" = true WHERE email = 'your-email@domain.com';
   ```
4. **Odhlaste se a přihlaste** znovu

## 5. Test funkcionality

### Základní test:
- ✅ Aplikace běží na portu 5000
- ✅ Můžete se registrovat/přihlásit
- ✅ Zobrazuje se 37 fotografických výzev
- ✅ Galerie je přístupná

### Test nahrávání:
- ✅ Lze nahrát fotografii
- ✅ AI ověří fotku (vyžaduje GEMINI_API_KEY)
- ✅ Fotka se zobrazí v galerii

### Admin test:
- ✅ Admin panel je přístupný
- ✅ Lze spravovat výzvy
- ✅ Statistiky se zobrazují

## 🚨 Častých problémy

### "Výzvy se nenačítají"
- Zkontrolujte, že jste přihlášeni
- Restartujte aplikaci
- Zkontrolujte Database záložku - měla by obsahovat data

### "AI analýza nefunguje" 
- Zkontrolujte nastavení `GEMINI_API_KEY` v Secrets
- Ověřte, že je API klíč aktivní na Google AI Studio

### "Databáze je prázdná"
- Klikněte na Database záložku v Replitu
- Spusťte: `npm run db:push` v konzoli
- Restartujte aplikaci

## 📞 Podpora

Pokud máte problémy s nastavením, zkontrolujte:

1. **Console logy** - hledejte chybové hlášky
2. **Database obsah** - ověřte, že obsahuje data
3. **Secrets nastavení** - zkontrolujte API klíče

---

🎉 **Po dokončení nastavení budete mít plně funkční svatební Photo Quest aplikaci!**