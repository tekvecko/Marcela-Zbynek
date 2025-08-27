
import { storage } from "./storage";

interface UserLevel {
  userId: string;
  level: number;
  experience: number;
  title: string;
}

interface LevelRequirement {
  level: number;
  experienceRequired: number;
  title: string;
  badge: string;
  perks: string[];
}

const LEVEL_REQUIREMENTS: LevelRequirement[] = [
  { level: 1, experienceRequired: 0, title: "Svatební nováček", badge: "🌟", perks: [] },
  { level: 2, experienceRequired: 100, title: "Začínající fotograf", badge: "📸", perks: ["Extra 5 bodů za fotky"] },
  { level: 3, experienceRequired: 250, title: "Aktivní host", badge: "🎉", perks: ["Odemknutí speciálních výzev"] },
  { level: 4, experienceRequired: 500, title: "Foto nadšenec", badge: "📷", perks: ["2x body za večerní fotky"] },
  { level: 5, experienceRequired: 1000, title: "Svatební expert", badge: "🏆", perks: ["Přístup k exkluzivním mini-hrám"] },
  { level: 6, experienceRequired: 1500, title: "Mistr objektivu", badge: "🎭", perks: ["3x body za skupinové fotky"] },
  { level: 7, experienceRequired: 2500, title: "Legendární fotograf", badge: "👑", perks: ["Vlastní výzvy", "VIP status"] },
  { level: 8, experienceRequired: 4000, title: "Svatební virtuos", badge: "💎", perks: ["Nekonečné uploady", "Mentor status"] },
  { level: 9, experienceRequired: 6000, title: "Nesmrtelná legenda", badge: "🌟", perks: ["Všechny perks", "Hall of Fame"] },
  { level: 10, experienceRequired: 10000, title: "Svatební bůh", badge: "⚡", perks: ["Ultimátní status"] }
];

export class LevelSystem {
  
  async addExperience(userId: string, experience: number, source: string): Promise<{
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    newTitle?: string;
  }> {
    try {
      const userLevel = await this.getUserLevel(userId);
      const oldLevel = userLevel.level;
      const newExperience = userLevel.experience + experience;
      
      const newLevelData = this.calculateLevel(newExperience);
      const leveledUp = newLevelData.level > oldLevel;
      
      await storage.updateUserLevel({
        userId,
        level: newLevelData.level,
        experience: newExperience,
        title: newLevelData.title
      });
      
      // Log experience gain
      await storage.logUserBehavior({
        userEmail: userId,
        actionType: 'experience_gained',
        details: `+${experience} XP z ${source}`,
        pointsEarned: experience
      });
      
      if (leveledUp) {
        console.log(`🆙 ${userId} leveloval na úroveň ${newLevelData.level}: ${newLevelData.title}`);
        
        // Award level-up bonus
        await storage.addUserPoints(userId, newLevelData.level * 20);
        
        await storage.logUserBehavior({
          userEmail: userId,
          actionType: 'level_up',
          details: `Dosáhl úrovně ${newLevelData.level}: ${newLevelData.title}`,
          pointsEarned: newLevelData.level * 20
        });
      }
      
      return {
        leveledUp,
        oldLevel,
        newLevel: newLevelData.level,
        newTitle: leveledUp ? newLevelData.title : undefined
      };
    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  }
  
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      let userLevel = await storage.getUserLevel(userId);
      
      if (!userLevel) {
        // Create initial level for new user
        userLevel = {
          userId,
          level: 1,
          experience: 0,
          title: "Svatební nováček"
        };
        await storage.saveUserLevel(userLevel);
      }
      
      return userLevel;
    } catch (error) {
      console.error('Error getting user level:', error);
      return { userId, level: 1, experience: 0, title: "Svatební nováček" };
    }
  }
  
  private calculateLevel(experience: number): { level: number; title: string; badge: string } {
    for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (experience >= LEVEL_REQUIREMENTS[i].experienceRequired) {
        return {
          level: LEVEL_REQUIREMENTS[i].level,
          title: LEVEL_REQUIREMENTS[i].title,
          badge: LEVEL_REQUIREMENTS[i].badge
        };
      }
    }
    return { level: 1, title: "Svatební nováček", badge: "🌟" };
  }
  
  getLevelRequirements(): LevelRequirement[] {
    return LEVEL_REQUIREMENTS;
  }
  
  getExperienceForNextLevel(currentExperience: number): number {
    const currentLevel = this.calculateLevel(currentExperience);
    const nextLevelReq = LEVEL_REQUIREMENTS.find(req => req.level > currentLevel.level);
    
    return nextLevelReq ? nextLevelReq.experienceRequired - currentExperience : 0;
  }
  
  async getLevelLeaderboard(): Promise<UserLevel[]> {
    try {
      return await storage.getLevelLeaderboard();
    } catch (error) {
      console.error('Error getting level leaderboard:', error);
      return [];
    }
  }
}

export const levelSystem = new LevelSystem();
