ConnectpenIDepliteplit Wedding Website s Photo Quest 📸💒

Svatební webová aplikace pro Marcelu a Zbyňka s interaktivním systémem fotografických výzev. Hosté mohou plnit úkoly, nahrávat fotky a soutěžit o nejlepší svatební fotografy.

## 🌟 Funkce

- **Photo Quest systém** - Gamifikované fotografické výzvy s body
- **AI verifikace** - Automatické ověřování fotek pomocí Google Gemini AI
- **Foto galerie** - Sdílení a lajkování fotek od hostů
- **Žebříček** - Soutěž o nejlepšího svatebního fotografa
- **Replit Auth** - Bezpečné přihlašování přes Replit účet
- **Admin panel** - Správa výzev a moderace obsahu
- **Responsivní design** - Krásné rozhraní optimalizované pro mobily

## 🚀 Rychlé spuštění

### Remixování projektu

1. **Remixněte projekt** na Replit
2. **Spusťte aplikaci** - Automaticky se zkontrolují potřebné SECRETS
3. **Nastavte chybějící SECRETS** podle pokynů v konzoli:
   - `GEMINI_API_KEY` - **POVINNÝ** API klíč pro Google Gemini AI
   - Ostatní SECRETS se vygenerují automaticky
4. **Restartujte aplikaci** - Výzvy se vytvoří automaticky při prvním spuštění

📖 **Detailní návod**: Viz [SECRETS_SETUP.md](SECRETS_SETUP.md)

### Manuální instalace

```bash
# Naklonujte repo
git clone <repository-url>
cd wedding-photo-quest

# Nainstalujte závislosti
npm install

# Nastavte databázi
npm run db:push

# Spusťte v development módu
npm run dev
```

## ⚙️ Konfigurace

### Environment proměnné

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_api_key
```

### Admin účet

Pro přístup k admin panelu nastavte e-mail v databázi s `isAdmin = true`:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-admin@email.com';
```

## 📱 Použití

### Pro hosty

1. **Přihlaste se** pomocí Replit účtu
2. **Prohlédněte si výzvy** na hlavní stránce
3. **Vyberte výzvu** a vyfotografujte podle zadání
4. **Nahrajte fotku** - AI automaticky ověří splnění úkolu
5. **Získejte body** a soutěžte v žebříčku

### Pro administrátory

1. **Přihlaste se** s admin účtem
2. **Spravujte výzvy** - vytvářejte, editujte, aktivujte/deaktivujte
3. **Moderujte fotky** - schvalujte nebo mazejte nevhodný obsah
4. **Sledujte statistiky** - přehled aktivity a postupu hostů

## 🏗️ Technické detaily

### Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Databáze**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + Shadcn/ui komponenty
- **AI**: Google Gemini API pro analýzu fotek
- **Autentizace**: any frDeploymentsenid)

### Struktura projektu

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI komponenty
│   │   ├── pages/        # Stránky aplikace  
│   │   └── contexts/     # Context providery
├── server/           # Express backend
│   ├── routes.ts         # API endpointy
│   ├── storage.ts        # Databázová vrstva
│   └── middleware/       # Middleware funkce
├── shared/           # Sdílené typy a schéma
└── uploads/          # Nahrané fotky
```

### Klíčové komponenty

- **PhotoQuest** - Hlavní stránka s výzvami
- **Challenge** - Detail jednotlivých výzev
- **PhotoGallery** - Galerie všech fotek
- **AdminPanel** - Administrační rozhraní

## 🔧 Vývoj

### Příkazy

```bash
npm run dev          # Spustí development server
npSestavíuild        # Sestaví pro produkci
npm run start        # Spustí produkční server
npm run db:push      # Aktualizuje databázové schéma
```

### Databázové migrace

```bash
# Aktualizovat schéma
npm run db:push

# Vynutit změny (pozor na ztrátu dat)
npm run db:push --force
```

## 📸 Defaultní fotografické výzvy

Aplikace automaticky vytvoří 37 přednastavených výzev při prvním spuštění:

### Obřadní momenty (vysoké body)
- Okamžik "Ano" 💍 (25 bodů)
- První manželský polibek 💋 (25 bodů)
- Výměna prstenů ✨ (20 bodů)

### Rodinné fotky
- Rodinné foto nevěsty/ženicha 👨‍👩‍👧‍👦 (15 bodů)
- Skupinové foto všech hostů 📸 (20 bodů)

### Večerní zábava
- První tanec 💃 (20 bodů)
- Krájení dortu 🎂 (18 bodů)
- Zábava na parketu 🕺 (12 bodů)

### Detaily a přípravy
- Svatební šaty detail 👗 (15 bodů)
- Svatební kytice 💐 (12 bodů)
- Dekorace a výzdoba 🎀 (10 bodů)

*...a mnoho dalších!*

## 🔒 Bezpečnost

- **Rate limiting** - Ochrana před spamem (10 uploadů/min)
- **Validace souborů** - Pouze podporované obrázky (JPEG, PNG, HEIC)
- **Parametrizované dotazy** - Ochrana před SQL injection
- **Sanitizace logů** - Žádné citlivé údaje v logách
- **CSRF ochrana** - Secure session cookies

## 🌍 Nasazení

Aplikace je připravena pro nasazení na Replit Deployments:

1. **Remixněte** projekt
2. **Nastavte** environment proměnné
3. **Deployněte** tlačítkem "Deploy"

## 📄 Licence

Tento projekt je vytvořen speciálně pro svatbu Marcely a Zbyňka (11. října 2025).

---

❤️ **Vytvořeno s láskou pro náš svatební den** ❤️