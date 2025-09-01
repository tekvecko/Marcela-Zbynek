
import { storage } from "./storage";

interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakType: 'photo' | 'login' | 'challenge';
}

interface DailyReward {
  day: number;
  points: number;
  bonusItem?: string;
  multiplier?: number;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, points: 10 },
  { day: 2, points: 15 },
  { day: 3, points: 20, bonusItem: "🎁 Bonus fotka" },
  { day: 4, points: 25 },
  { day: 5, points: 30, multiplier: 1.2 },
  { day: 6, points: 40 },
  { day: 7, points: 50, bonusItem: "🏆 Týdenní mistr", multiplier: 1.5 },
  // Cyklus se opakuje s bonusy
  { day: 14, points: 100, bonusItem: "💎 Dvoutýdenní legenda", multiplier: 2.0 },
  { day: 21, points: 150, bonusItem: "👑 Mistr konzistence", multiplier: 3.0 }
];

export class StreakSystem {
  
  async updateUserStreak(userId: string, activityType: 'photo' | 'login' | 'challenge'): Promise<any> {
    try {
      const existingStreak = await this.getUserStreak(userId, activityType);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreak = 1;
      let longestStreak = 1;
      
      if (existingStreak) {
        const lastActivity = new Date(existingStreak.lastActivityDate || existingStreak.lastActivity);
        lastActivity.setHours(0, 0, 0, 0);
        
        const daysDiff = (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 0) {
          // Same day, don't update streak
          return existingStreak;
        } else if (daysDiff === 1) {
          // Consecutive day, increment streak
          currentStreak = existingStreak.currentStreak + 1;
          longestStreak = Math.max(existingStreak.longestStreak, currentStreak);
        } else {
          // Streak broken, start over
          currentStreak = 1;
          longestStreak = existingStreak.longestStreak;
        }
      }
      
      const streakData = {
        userEmail: userId, // Use userEmail instead of userId to match DatabaseStorage expectation
        streakType: activityType,
        currentStreak,
        longestStreak,
        lastActivity: new Date()
      };
      
      await storage.saveUserStreak(streakData);
      
      // Check for daily rewards
      if (activityType === 'login') {
        await this.checkDailyReward(userId, currentStreak);
      }
      
      return {
        userId,
        currentStreak,
        longestStreak,
        lastActivityDate: new Date(),
        streakType: activityType
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }
  
  async getUserStreak(userId: string, streakType: 'photo' | 'login' | 'challenge'): Promise<any | null> {
    try {
      return await storage.getUserStreak(userId, streakType);
    } catch (error) {
      console.error('Error getting user streak:', error);
      return null;
    }
  }
  
  private async checkDailyReward(userId: string, streakDay: number): Promise<void> {
    try {
      const reward = this.getDailyReward(streakDay);
      if (reward) {
        await storage.addUserPoints(userId, reward.points);
        
        if (reward.bonusItem) {
          await storage.logUserBehavior({
            userEmail: userId,
            actionType: 'daily_reward',
            details: `Denní odměna den ${streakDay}: ${reward.bonusItem}`,
            pointsEarned: reward.points
          });
        }
        
        console.log(`🎁 Daily reward given to ${userId}: ${reward.points} points (day ${streakDay})`);
      }
    } catch (error) {
      console.error('Error checking daily reward:', error);
    }
  }
  
  getDailyReward(day: number): DailyReward | null {
    // Find exact day or use modulo for cycling rewards
    let reward = DAILY_REWARDS.find(r => r.day === day);
    
    if (!reward && day > 7) {
      // Use cycling logic for days beyond initial week
      const cycleDay = ((day - 1) % 7) + 1;
      reward = DAILY_REWARDS.find(r => r.day === cycleDay);
      
      // Add bonus for long streaks
      if (reward && day > 14) {
        reward = { ...reward, points: Math.floor(reward.points * (1 + day / 30)) };
      }
    }
    
    return reward || null;
  }
  
  async getStreakLeaderboard(streakType: 'photo' | 'login' | 'challenge'): Promise<UserStreak[]> {
    try {
      return await storage.getStreakLeaderboard(streakType);
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      return [];
    }
  }
}

export const streakSystem = new StreakSystem();
