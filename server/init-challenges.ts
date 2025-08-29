import { db } from "./db";
import { questChallenges } from "../shared/schema";

// Svatba je 11. října 2025, časový harmonogram odemykání:
const defaultChallenges = [
  // OKAMŽITĚ DOSTUPNÉ - začátek aplikace (základní výzvy)
  {
    title: "Dekorace a výzdoba 🎀",
    description: "Svatební dekorace a výzdoba prostoru",
    points: 10,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date(),
    unlockOrder: 1
  },
  {
    title: "Místo obřadu 🏰",
    description: "Zachyťte místo kde se koná svatební obřad",
    points: 10,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date(),
    unlockOrder: 2
  },
  {
    title: "Výzdoba stolu 🍽️",
    description: "Krásně prostřený svatební stůl",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date(),
    unlockOrder: 3
  },

  // 7 DNÍ PŘED SVATBOU - pokročilé přípravy
  {
    title: "Svatební šaty detail 👗",
    description: "Krásný detail svatebních šatů",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-04T00:00:00Z"),
    unlockOrder: 4
  },
  {
    title: "Svatební boty 👠",
    description: "Detail svatebních bot nevěsty nebo ženicha",
    points: 10,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-04T00:00:00Z"),
    unlockOrder: 5
  },
  {
    title: "Svatební kytice 💐",
    description: "Nevěstina kytice v plné kráse",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-04T00:00:00Z"),
    unlockOrder: 6
  },

  // 3 DNY PŘED SVATBOU - finální přípravy
  {
    title: "Svatební auto 🚗",
    description: "Auto nevěsty nebo ženicha s výzdobou",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-08T00:00:00Z"),
    unlockOrder: 7
  },
  {
    title: "Svatební dort 🍰",
    description: "Náš krásný svatební dort",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-08T00:00:00Z"),
    unlockOrder: 8
  },
  {
    title: "Družička v akci 👭",
    description: "Družičky pomáhají nebo se baví",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-08T00:00:00Z"),
    unlockOrder: 9
  },

  // DEN SVATBY - RÁNO (6:00) - přípravy nevěsty/ženicha
  {
    title: "Přípravy před obřadem 💄",
    description: "Nevěsta nebo ženich se připravují",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T06:00:00Z"),
    unlockOrder: 10
  },
  {
    title: "Příprava ženicha 🤵",
    description: "Ženich se připravuje před obřadem",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T06:00:00Z"),
    unlockOrder: 11
  },
  {
    title: "Detail rukou 🤝",
    description: "Krásný detail propojených rukou novomanželů",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T08:00:00Z"),
    unlockOrder: 12
  },

  // DEN SVATBY - OBŘAD (14:00) - hlavní ceremoniální výzvy
  {
    title: "Okamžik \"Ano\" 💍",
    description: "Zachyťte moment výměny slibů nebo \"ano\"",
    points: 25,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 13
  },
  {
    title: "První manželský polibek 💋",
    description: "Ten magický první polibek jako manželé",
    points: 25,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 14
  },
  {
    title: "Výměna prstenů ✨",
    description: "Detail snubních prstenů na rukou",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 15
  },
  {
    title: "Svědci v akci 🤵‍♂️👰‍♀️",
    description: "Svědci během obřadu nebo při podpisu",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 16
  },
  {
    title: "Svatební svíčky 🕯️",
    description: "Rituál se svatebními svíčkami",
    points: 18,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 17
  },

  // DEN SVATBY - PO OBŘADU (15:00) - gratulace a foto
  {
    title: "Gratulace novomanželům 🎉",
    description: "Moment gratulací a objímání po obřadu",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T15:00:00Z"),
    unlockOrder: 18
  },
  {
    title: "Konfety a rýže 🎊",
    description: "Házení rýže, konfet nebo okvětních lístků",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T15:00:00Z"),
    unlockOrder: 19
  },
  {
    title: "Skupinové foto všech hostů 📸",
    description: "Všichni svatební hosté na jedné fotce",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T15:30:00Z"),
    unlockOrder: 20
  },

  // DEN SVATBY - RODINNÉ FOTO (16:00)
  {
    title: "Rodinné foto nevěsty 👨‍👩‍👧‍👦",
    description: "Rodina nevěsty pohromadě",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T16:00:00Z"),
    unlockOrder: 21
  },
  {
    title: "Rodinné foto ženicha 👨‍👩‍👧‍👦",
    description: "Rodina ženicha pohromadě",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T16:00:00Z"),
    unlockOrder: 22
  },
  {
    title: "Generační foto 👴👵",
    description: "Tři generace na jedné fotce",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T16:30:00Z"),
    unlockOrder: 23
  },

  // DEN SVATBY - VEČÍREK (18:00) - zábava začíná
  {
    title: "Toast a přípitek 🥂",
    description: "Projevy a přípitek na novomanžele",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T18:00:00Z"),
    unlockOrder: 24
  },
  {
    title: "Krájení dortu 🎂",
    description: "Společné krájení svatebního dortu",
    points: 18,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T18:30:00Z"),
    unlockOrder: 25
  },
  {
    title: "První tanec 💃",
    description: "Náš speciální první tanec jako manželé",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T19:00:00Z"),
    unlockOrder: 26
  },
  {
    title: "Tanec s rodiči 👫",
    description: "Nevěsta s tatínkem nebo ženich s maminkou",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T19:30:00Z"),
    unlockOrder: 27
  },

  // DEN SVATBY - POZDNÍ VEČER (20:00) - plná zábava
  {
    title: "Zábava na parketu 🕺",
    description: "Hosté si užívají na tanečním parketu",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T20:00:00Z"),
    unlockOrder: 28
  },
  {
    title: "Hudba živá 🎵",
    description: "Hudebníci nebo DJ při práci",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T20:00:00Z"),
    unlockOrder: 29
  },
  {
    title: "Děti na svatbě 👶",
    description: "Roztomilé momenty s dětmi hostů",
    points: 12,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T20:00:00Z"),
    unlockOrder: 30
  },

  // DEN SVATBY - TRADICE (21:00)
  {
    title: "Házen kytice 🎯",
    description: "Házení svatební kytice svobodným",
    points: 18,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T21:00:00Z"),
    unlockOrder: 31
  },
  {
    title: "Podvazek tradice 🎀",
    description: "Tradice s podvazkem",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T21:30:00Z"),
    unlockOrder: 32
  },

  // UNIVERZÁLNÍ VÝZVY (dostupné celý den svatby)
  {
    title: "Šťastné slzy 😭",
    description: "Emoce a dojetí během svatby",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 33
  },
  {
    title: "Detox slz 😢",
    description: "Někdo se dojme až do slz štěstím",
    points: 18,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 34
  },
  {
    title: "Smích a radost 😊",
    description: "Upřímné momenty štěstí a smíchu",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 35
  },
  {
    title: "Nečekané okamžiky 😄",
    description: "Vtipné, spontánní nebo nečekané situace",
    points: 15,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 36
  },
  {
    title: "Černobílá klasika ⚫⚪",
    description: "Artistic černobílá fotka z jakéhokoliv momentu",
    points: 20,
    targetPhotos: 1,
    isActive: true,
    unlockDate: new Date("2025-10-11T14:00:00Z"),
    unlockOrder: 37
  }
];

export async function initializeDefaultChallenges() {
  try {
    console.log("🔄 Kontroluji existující fotovýzvy...");

    // Pokud není databáze dostupná, přeskoč inicializaci
    if (!db) {
      console.log("🔄 Databáze není dostupná, výzvy budou vytvořeny v in-memory storage");
      return;
    }

    // Zkontroluj, zda tabulka existuje a zda již existují nějaké výzvy
    let existingChallenges;
    try {
      existingChallenges = await db.select().from(questChallenges).limit(1);
    } catch (error: any) {
      if (error.code === '42P01') { // tabulka neexistuje
        console.log("⚠️  Tabulka quest_challenges neexistuje. Spusťte prosím: npx drizzle-kit push");
        console.log("🔄 Přepínám na in-memory storage...");
        return;
      }
      throw error;
    }

    if (existingChallenges.length > 0) {
      console.log("✅ Fotovýzvy již existují, přeskakuji inicializaci");
      return;
    }

    console.log("🆕 Vytvářím výchozí fotovýzvy...");

    // Vytvoř všechny výchozí výzvy
    for (const challenge of defaultChallenges) {
      await db.insert(questChallenges).values(challenge);
      console.log(`   ✓ Vytvořena výzva: ${challenge.title}`);
    }

    console.log(`🎉 Úspěšně vytvořeno ${defaultChallenges.length} fotovýzev!`);

  } catch (error) {
    console.error("❌ Chyba při vytváření výzev:", error);

    // Kontrola, zda je problém s databází
    if (error.message?.includes('endpoint has been disabled') || error.code === 'XX000') {
      console.log("🔄 Databáze není dostupná, aplikace pokračuje v režimu bez databáze");
      console.log("💡 Pro opravu: Vytvořte novou PostgreSQL databázi v Replit pomocí Database nástroje");
      console.log("💡 Alternativně: Nastavte SUPABASE_DATABASE_URL pro záložní databázi");
      return;
    }

    // Pro ostatní chyby, vyhoď exception
    throw error;
  }
}