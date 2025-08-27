
# Nastavení databáze pro remixovaný projekt

## Automatické nastavení

Při startu serveru se automaticky:
1. Spustí migrace databáze
2. Vytvoří všechny potřebné tabulky
3. Nastaví indexy a vztahy

## Manuální inicializace

Pokud potřebujete manuálně inicializovat databázi:

```bash
# Generování nových migrací
npx drizzle-kit generate

# Spuštění migrací
npx drizzle-kit migrate

# Nebo použití našeho skriptu
npm run tsx server/init-database.ts
```

## Struktura databáze

Projekt obsahuje následující hlavní tabulky:
- `users` - uživatelé a autentifikace
- `quest_challenges` - výzvy a úkoly
- `uploaded_photos` - nahrané fotky s AI analýzou
- `photo_likes` - hodnocení fotek
- `quest_progress` - progress uživatelů
- `mini_games` - mini hry
- `mini_game_scores` - skóre z her
- `user_behavior_logs` - sledování chování
- `ai_learning_insights` - AI pozorování

## Prostředí

Ujistěte se, že máte nastavenu proměnnou `DATABASE_URL` v Replit Secrets.
