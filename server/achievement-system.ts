
import { storage } from "./storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'photo' | 'mini_game' | 'social' | 'special';
  requirement: {
    action: string;
    count: number;
    timeframe?: number; // in days
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedBy?: string[];
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Photo Achievements
  {
    id: "first_photo",
    title: "První krok 📸",
    description: "Nahraj svou první svatební fotku",
    icon: "📸",
    type: "photo",
    requirement: { action: "upload_photo", count: 1 },
    points: 10,
    rarity: "common"
  },
  {
    id: "photo_marathon",
    title: "Foto maratón 📱",
    description: "Nahraj 10 fotek za jeden den",
    icon: "📱",
    type: "photo",
    requirement: { action: "upload_photo", count: 10, timeframe: 1 },
    points: 50,
    rarity: "rare"
  },
  {
    id: "challenge_master",
    title: "Mistr výzev 🏆",
    description: "Splň 15 foto výzev",
    icon: "🏆",
    type: "photo",
    requirement: { action: "complete_challenge", count: 15 },
    points: 100,
    rarity: "epic"
  },
  
  // Mini-game Achievements
  {
    id: "quiz_expert",
    title: "Svatební expert 🧠",
    description: "Získej 100% úspěšnost v kvízu",
    icon: "🧠",
    type: "mini_game",
    requirement: { action: "perfect_quiz", count: 1 },
    points: 30,
    rarity: "rare"
  },
  {
    id: "game_addict",
    title: "Herní závislák 🎮",
    description: "Zahraj si všechny mini-hry",
    icon: "🎮",
    type: "mini_game",
    requirement: { action: "play_all_games", count: 1 },
    points: 75,
    rarity: "epic"
  },
  
  // Social Achievements
  {
    id: "social_butterfly",
    title: "Společenský motýl 🦋",
    description: "Lajkni 20 fotek ostatních",
    icon: "🦋",
    type: "social",
    requirement: { action: "like_photos", count: 20 },
    points: 40,
    rarity: "common"
  },
  {
    id: "top_photographer",
    title: "Nejlepší fotograf 📷",
    description: "Získej nejvíce lajků za fotku",
    icon: "📷",
    type: "social",
    requirement: { action: "most_liked_photo", count: 1 },
    points: 80,
    rarity: "legendary"
  },
  
  // Special Achievements
  {
    id: "early_bird",
    title: "Ranní ptáče 🌅",
    description: "Nahraj fotku před 8:00",
    icon: "🌅",
    type: "special",
    requirement: { action: "upload_early", count: 1 },
    points: 25,
    rarity: "rare"
  },
  {
    id: "night_owl",
    title: "Noční sova 🦉",
    description: "Nahraj fotku po 22:00",
    icon: "🦉",
    type: "special",
    requirement: { action: "upload_late", count: 1 },
    points: 25,
    rarity: "rare"
  },
  {
    id: "speedster",
    title: "Rychlík ⚡",
    description: "Splň výzvu do 60 sekund od otevření",
    icon: "⚡",
    type: "special",
    requirement: { action: "fast_completion", count: 1 },
    points: 35,
    rarity: "epic"
  }
];

export class AchievementSystem {
  
  async checkUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const userProgress = await storage.getUserBehaviorLogs({ userEmail: userId, limit: 1000 });
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = userAchievements.map(ua => ua.achievementId);
      const newAchievements: UserAchievement[] = [];

      for (const achievement of ACHIEVEMENTS) {
        if (unlockedIds.includes(achievement.id)) continue;

        const progress = await this.calculateProgress(userId, achievement, userProgress);
        
        if (progress >= achievement.requirement.count) {
          const newAchievement = {
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
            progress: achievement.requirement.count
          };
          
          await this.unlockAchievement(newAchievement);
          newAchievements.push(newAchievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private async calculateProgress(userId: string, achievement: Achievement, userProgress: any[]): Promise<number> {
    const now = new Date();
    let relevantActions = userProgress;

    // Filter by timeframe if specified
    if (achievement.requirement.timeframe) {
      const cutoff = new Date(now.getTime() - achievement.requirement.timeframe * 24 * 60 * 60 * 1000);
      relevantActions = userProgress.filter(log => new Date(log.createdAt) >= cutoff);
    }

    switch (achievement.requirement.action) {
      case 'upload_photo':
        return relevantActions.filter(log => log.actionType === 'photo_upload').length;
      
      case 'complete_challenge':
        return relevantActions.filter(log => log.actionType === 'quest_complete').length;
      
      case 'like_photos':
        return relevantActions.filter(log => log.actionType === 'photo_like').length;
      
      case 'perfect_quiz':
        const quizScores = await storage.getMiniGameScores(userId);
        return quizScores.filter(score => 
          score.gameType === 'trivia' && score.score === score.maxScore
        ).length;
      
      case 'play_all_games':
        const allGames = await storage.getMiniGames();
        const playedGames = await storage.getMiniGameScores(userId);
        const uniqueGames = new Set(playedGames.map(score => score.gameId));
        return uniqueGames.size >= allGames.length ? 1 : 0;
      
      case 'upload_early':
        return relevantActions.filter(log => {
          const hour = new Date(log.createdAt).getHours();
          return log.actionType === 'photo_upload' && hour < 8;
        }).length;
      
      case 'upload_late':
        return relevantActions.filter(log => {
          const hour = new Date(log.createdAt).getHours();
          return log.actionType === 'photo_upload' && hour >= 22;
        }).length;
      
      default:
        return 0;
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      return await storage.getUserAchievements(userId);
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  async unlockAchievement(achievement: UserAchievement): Promise<void> {
    try {
      await storage.saveUserAchievement(achievement);
      console.log(`🏆 Achievement unlocked: ${achievement.achievementId} for ${achievement.userId}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
  }
}

export const achievementSystem = new AchievementSystem();
