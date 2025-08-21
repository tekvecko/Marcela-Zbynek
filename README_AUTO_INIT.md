# Automatická inicializace fotovýzev

## Co se stalo

Implementoval jsem automatické vytvoření všech fotovýzev při prvním spuštění aplikace. To znamená, že když někdo remixuje tento projekt na Replitu, automaticky se vytvoří všechny potřebné fotovýzvy bez nutnosti ručního nastavení.

## Jak to funguje

1. **Při startu aplikace** se spustí funkce `initializeDefaultChallenges()`
2. **Kontrola existence**: Zkontroluje se, zda už existují nějaké fotovýzvy v databázi
3. **Automatické vytvoření**: Pokud databáze je prázdná, automaticky se vytvoří všech 37 fotovýzev
4. **Bez duplikátů**: Pokud už výzvy existují, nic se nevytváří

## Seznam všech 37 fotovýzev

Všechny následující výzvy se vytvoří automaticky:

- První tanec 💃 (20 bodů)
- Svatební kytice 💐 (12 bodů)
- Svatební dort 🍰 (12 bodů)
- Krájení dortu 🎂 (18 bodů)
- Výměna prstenů ✨ (20 bodů)
- První manželský polibek 💋 (25 bodů)
- Okamžik "Ano" 💍 (25 bodů)
- Házen kytice 🎯 (18 bodů)
- Skupinové foto všech hostů 📸 (20 bodů)
- Šťastné slzy 😭 (20 bodů)
- Černobílá klasika ⚫⚪ (20 bodů)
- Smích a radost 😊 (15 bodů)
- Rodinné foto nevěsty 👨‍👩‍👧‍👦 (15 bodů)
- Rodinné foto ženicha 👨‍👩‍👧‍👦 (15 bodů)
- Svatební šaty detail 👗 (15 bodů)
- Tanec s rodiči 👫 (15 bodů)
- Detail rukou 🤝 (15 bodů)
- Nečekané okamžiky 😄 (15 bodů)
- Přípravy před obřadem 💄 (15 bodů)
- Svědci v akci 🤵‍♂️👰‍♀️ (15 bodů)
- Gratulace novomanželům 🎉 (15 bodů)
- Zábava na parketu 🕺 (12 bodů)
- Toast a přípitek 🥂 (12 bodů)
- Děti na svatbě 👶 (12 bodů)
- Dekorace a výzdoba 🎀 (10 bodů)
- Konfety a rýže 🎊 (15 bodů)
- Generační foto 👴👵 (20 bodů)
- Podvazek tradice 🎀 (15 bodů)
- Družička v akci 👭 (12 bodů)
- Místo obřadu 🏰 (10 bodů)
- Hudba živá 🎵 (12 bodů)
- Svatební auto 🚗 (12 bodů)
- Svatební boty 👠 (10 bodů)
- Detox slz 😢 (18 bodů)
- Svatební svíčky 🕯️ (18 bodů)
- Výzdoba stolu 🍽️ (12 bodů)
- Příprava ženicha 🤵 (15 bodů)

## Výhody

- **Jednoduché remixování**: Kdokoliv může remixnout projekt a okamžitě má funkční svatební aplikaci
- **Žádná ruční práce**: Není potřeba ručně vytvářet výzvy přes admin panel
- **Kompatibilita**: Původní data se neztratí, nové výzvy se nevytvoří, pokud už nějaké existují
- **Kompletní sada**: Všech 37 výzev pokrývá celý svatební den od příprav po oslavu

## Technické detaily

- Soubor: `server/init-challenges.ts`
- Spuštění: Při startu serveru v `server/index.ts`
- Bezpečnost: Kontrola existence před vytvořením
- Logování: Informace o procesu v konzoli serveru