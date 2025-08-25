import { miniGamesStorage } from "./mini-games-storage";

const defaultMiniGames = [
  {
    title: "Svatební kvíz 💕",
    description: "Otázky o nevěstě a ženichovi - jak dobře je znáte?",
    gameType: "trivia",
    points: 20,
    timeLimit: 120,
    gameData: {
      questions: [
        {
          question: "Kde se Marcela a Zbyněk poznali poprvé?",
          answers: ["V práci", "Na univerzitě", "Přes přátele", "Na dovolené"],
          correctAnswer: 2,
          explanation: "Poznali se přes společné přátele na párty!"
        },
        {
          question: "Jaké je nejoblíbenější jídlo nevěsty?",
          answers: ["Pizza", "Sushi", "Pasta", "Řízek"],
          correctAnswer: 1,
          explanation: "Marcela miluje sushi!"
        },
        {
          question: "Kolik let se znají Marcela a Zbyněk?",
          answers: ["3 roky", "5 let", "7 let", "10 let"],
          correctAnswer: 2,
          explanation: "Jsou spolu už 7 krásných let!"
        },
        {
          question: "Kde se zasnoubili?",
          answers: ["Doma", "V Praze", "Na dovolené", "V restauraci"],
          correctAnswer: 2,
          explanation: "Zásnuby proběhly během romantické dovolené!"
        },
        {
          question: "Jaké je koníček ženicha?",
          answers: ["Fotbal", "Vaření", "Programování", "Cestování"],
          correctAnswer: 2,
          explanation: "Zbyněk je programátor a miluje technologie!"
        }
      ]
    }
  },
  {
    title: "Pexeso lásky 💝",
    description: "Najděte páry svatebních symbolů v této hře na paměť",
    gameType: "memory",
    points: 15,
    timeLimit: 90,
    gameData: {
      pairs: [
        { symbol: "💕", name: "Srdce" },
        { symbol: "💍", name: "Prsteny" },
        { symbol: "💒", name: "Kostel" },
        { symbol: "💐", name: "Kytice" },
        { symbol: "🥂", name: "Přípitek" },
        { symbol: "🍰", name: "Dort" },
        { symbol: "👰", name: "Nevěsta" },
        { symbol: "🤵", name: "Ženich" }
      ]
    }
  },
  {
    title: "Spojte slova 📝",
    description: "Spojte svatební pojmy s jejich významy",
    gameType: "word_match",
    points: 10,
    timeLimit: 60,
    gameData: {
      pairs: [
        { word: "Závoj", match: "Doplněk nevěsty" },
        { word: "Družička", match: "Pomocnice nevěsty" },
        { word: "Svědek", match: "Pomocník ženicha" },
        { word: "Kytice", match: "Květiny pro nevěstu" },
        { word: "Prsteny", match: "Symbol věrnosti" },
        { word: "Dort", match: "Sladký vrchol" }
      ]
    }
  },
  {
    title: "Rychlost reakce ⚡",
    description: "Rychle klikejte na správné symboly lásky!",
    gameType: "reaction_speed",
    points: 10,
    timeLimit: 30,
    gameData: {
      targetSymbol: "💕",
      distractors: ["💔", "🖤", "💜", "💙", "💚"],
      targetCount: 15
    }
  }
];

export async function initializeDefaultMiniGames() {
  try {
    console.log("🔄 Kontroluji existující mini-hry...");

    const existingGames = await miniGamesStorage.getMiniGames();

    if (existingGames.length > 0) {
      console.log("✅ Mini-hry již existují, přeskakuji inicializaci");
      return;
    }

    console.log("🆕 Vytvářím výchozí mini-hry...");

    for (const game of defaultMiniGames) {
      await miniGamesStorage.createMiniGame(game);
      console.log(`   ✓ Vytvořena mini-hra: ${game.title}`);
    }

    console.log("✅ Výchozí mini-hry byly úspěšně vytvořeny");
  } catch (error) {
    console.error("❌ Chyba při vytváření mini-her:", error);
    
    // Kontrola, zda je problém s databází
    if (error.message?.includes('endpoint has been disabled') || error.code === 'XX000') {
      console.log("🔄 Databáze není dostupná, inicializuji mini-hry v in-memory storage");
      console.log("💡 Aplikace bude používat lokální úložiště dokud nebude databáze opravena");
      
      // Mini-hry se vytvoří automaticky při prvním použití v memory storage
      return;
    }
    
    // Pro ostatní chyby, vyhoď exception
    throw error;
  }
}
}