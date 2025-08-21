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
    description: "Najděte páry romantic symbolů!",
    gameType: "memory",
    points: 15,
    timeLimit: 90,
    gameData: {
      pairs: [
        { id: 1, symbol: "💕", name: "Srdce" },
        { id: 2, symbol: "🌹", name: "Růže" },
        { id: 3, symbol: "💍", name: "Prstýnek" },
        { id: 4, symbol: "👰", name: "Nevěsta" },
        { id: 5, symbol: "🤵", name: "Ženich" },
        { id: 6, symbol: "💒", name: "Kostel" },
        { id: 7, symbol: "🍰", name: "Dort" },
        { id: 8, symbol: "💐", name: "Kytice" }
      ]
    }
  },
  {
    title: "Svatební slova 📝",
    description: "Spojte svatební pojmy s jejich významy!",
    gameType: "word_match",
    points: 12,
    timeLimit: 60,
    gameData: {
      pairs: [
        { word: "Polterabend", meaning: "Německá tradice rozbíjení nádobí" },
        { word: "Podvazek", meaning: "Tradiční svatební doplněk nevěsty" },
        { word: "Družička", meaning: "Pomocnice nevěsty při svatbě" },
        { word: "Svědek", meaning: "Oficiální svědek svatebního obřadu" },
        { word: "Krejčovec", meaning: "Šije svatební šaty" },
        { word: "Konfety", meaning: "Házejí se na novomanžele" }
      ]
    }
  },
  {
    title: "Fakta o páru 💏",
    description: "Pravda nebo lež? Tipujte správně!",
    gameType: "couple_facts",
    points: 18,
    timeLimit: 75,
    gameData: {
      statements: [
        {
          statement: "Marcela a Zbyněk mají oba rádi sci-fi filmy",
          isTrue: true,
          explanation: "Oba jsou velkými fanoušky sci-fi!"
        },
        {
          statement: "Jejich první rande bylo v kině",
          isTrue: false,
          explanation: "První rande bylo na koncertu!"
        },
        {
          statement: "Zbyněk umí vařit lepší guláš než Marcela",
          isTrue: true,
          explanation: "Zbyněk je skutečný kuchař!"
        },
        {
          statement: "Marcela řídí rychleji než Zbyněk",
          isTrue: false,
          explanation: "Zbyněk je rychlejší řidič!"
        },
        {
          statement: "Oba umí hrát na hudební nástroj",
          isTrue: true,
          explanation: "Marcela na klavír, Zbyněk na kytaru!"
        }
      ]
    }
  },
  {
    title: "Rychlé reakce 🏃‍♀️",
    description: "Klikejte na srdíčka co nejrychleji!",
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
    
    console.log(`🎉 Úspěšně vytvořeno ${defaultMiniGames.length} mini-her!`);
    
  } catch (error) {
    console.error("❌ Chyba při vytváření výchozích mini-her:", error);
  }
}