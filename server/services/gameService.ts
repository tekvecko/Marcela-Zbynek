import { storage } from "../storage";
import { achievementService } from "./achievementService";

export class GameService {
  async completeChallenge(userId: string, challengeId: string) {
    try {
      const progress = await storage.completeChallenge(userId, challengeId);
      
      // Check and update achievements after challenge completion
      await achievementService.checkAndUpdateAchievements(userId);
      
      return progress;
    } catch (error) {
      console.error("Error completing challenge:", error);
      throw error;
    }
  }

  async recordMiniGameScore(userId: string, miniGameId: string, score: number) {
    try {
      const gameScore = await storage.recordMiniGameScore(userId, miniGameId, score);
      
      // Check and update achievements after mini-game
      await achievementService.checkAndUpdateAchievements(userId);
      
      return gameScore;
    } catch (error) {
      console.error("Error recording mini-game score:", error);
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const stats = await storage.getUserStats(userId);
      const achievements = await storage.getUserAchievements(userId);
      const recentActivity = await storage.getUserActivity(userId, 10);
      const challengeProgress = await storage.getUserChallengeProgress(userId);

      return {
        user,
        stats,
        achievements,
        recentActivity,
        challengeProgress,
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  async initializeDefaultData() {
    try {
      // Initialize default challenges
      const defaultChallenges = [
        {
          title: "První kroky",
          description: "Dokončit první výzvu v systému",
          points: 100,
          category: "beginner"
        },
        {
          title: "Denní výzva",
          description: "Dokončit výzvu v jeden den",
          points: 200,
          category: "daily"
        },
        {
          title: "Týdenní válečník",
          description: "Dokončit 5 výzev za týden",
          points: 500,
          category: "weekly"
        }
      ];

      for (const challenge of defaultChallenges) {
        try {
          await storage.createChallenge(challenge);
        } catch (error) {
          // Challenge might already exist
          console.log("Challenge already exists or error creating:", challenge.title);
        }
      }

      // Initialize default achievements
      await achievementService.initializeDefaultAchievements();

      console.log("Default game data initialized successfully");
    } catch (error) {
      console.error("Error initializing default data:", error);
      throw error;
    }
  }
}

export const gameService = new GameService();
