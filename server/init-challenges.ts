import { db } from "./db";
import { questChallenges } from "../shared/schema";

const defaultChallenges = [
  {
    title: "První tanec 💃",
    description: "Náš speciální první tanec jako manželé",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební kytice 💐",
    description: "Nevěstina kytice v plné kráse",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební dort 🍰",
    description: "Náš krásný svatební dort",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Krájení dortu 🎂",
    description: "Společné krájení svatebního dortu",
    points: 18,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Výměna prstenů ✨",
    description: "Detail snubních prstenů na rukou",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "První manželský polibek 💋",
    description: "Ten magický první polibek jako manželé",
    points: 25,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Okamžik \"Ano\" 💍",
    description: "Zachyťte moment výměny slibů nebo \"ano\"",
    points: 25,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Házen kytice 🎯",
    description: "Házení svatební kytice svobodným",
    points: 18,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Skupinové foto všech hostů 📸",
    description: "Všichni svatební hosté na jedné fotce",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Šťastné slzy 😭",
    description: "Emoce a dojetí během svatby",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Černobílá klasika ⚫⚪",
    description: "Artistic černobílá fotka z jakéhokoliv momentu",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Smích a radost 😊",
    description: "Upřímné momenty štěstí a smíchu",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Rodinné foto nevěsty 👨‍👩‍👧‍👦",
    description: "Rodina nevěsty pohromadě",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Rodinné foto ženicha 👨‍👩‍👧‍👦",
    description: "Rodina ženicha pohromadě",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební šaty detail 👗",
    description: "Krásný detail svatebních šatů",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Tanec s rodiči 👫",
    description: "Nevěsta s tatínkem nebo ženich s maminkou",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Detail rukou 🤝",
    description: "Krásný detail propojených rukou novomanželů",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Nečekané okamžiky 😄",
    description: "Vtipné, spontánní nebo nečekané situace",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Přípravy před obřadem 💄",
    description: "Nevěsta nebo ženich se připravují",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svědci v akci 🤵‍♂️👰‍♀️",
    description: "Svědci během obřadu nebo při podpisu",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Gratulace novomanželům 🎉",
    description: "Moment gratulací a objímání po obřadu",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Zábava na parketu 🕺",
    description: "Hosté si užívají na tanečním parketu",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Toast a přípitek 🥂",
    description: "Projevy a přípitek na novomanžele",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Děti na svatbě 👶",
    description: "Roztomilé momenty s dětmi hostů",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Dekorace a výzdoba 🎀",
    description: "Svatební dekorace a výzdoba prostoru",
    points: 10,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Konfety a rýže 🎊",
    description: "Házení rýže, konfet nebo okvětních lístků",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Generační foto 👴👵",
    description: "Tři generace na jedné fotce",
    points: 20,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Podvazek tradice 🎀",
    description: "Tradice s podvazkem",
    points: 15,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Družička v akci 👭",
    description: "Družičky pomáhají nebo se baví",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Místo obřadu 🏰",
    description: "Zachyťte místo kde se koná svatební obřad",
    points: 10,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Hudba živá 🎵",
    description: "Hudebníci nebo DJ při práci",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební auto 🚗",
    description: "Auto nevěsty nebo ženicha s výzdobou",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební boty 👠",
    description: "Detail svatebních bot nevěsty nebo ženicha",
    points: 10,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Detox slz 😢",
    description: "Někdo se dojme až do slz štěstím",
    points: 18,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Svatební svíčky 🕯️",
    description: "Rituál se svatebními svíčkami",
    points: 18,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Výzdoba stolu 🍽️",
    description: "Krásně prostřený svatební stůl",
    points: 12,
    targetPhotos: 1,
    isActive: true
  },
  {
    title: "Příprava ženicha 🤵",
    description: "Ženich se připravuje před obřadem",
    points: 15,
    targetPhotos: 1,
    isActive: true
  }
];

export async function initializeDefaultChallenges() {
  try {
    console.log("🔄 Kontroluji existující fotovýzvy...");
    
    // Zkontroluj, zda již existují nějaké výzvy
    const existingChallenges = await db.select().from(questChallenges).limit(1);
    
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
    console.error("❌ Chyba při vytváření výchozích výzev:", error);
    // Nespadneme kvůli chybě inicializace, aplikace by měla pokračovat
  }
}