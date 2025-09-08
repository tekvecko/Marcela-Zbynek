import { storage } from "../storage";
import { db } from "../db";
import { achievements, userAchievements, userChallengeProgress, userMiniGameScores } from "@shared/schema";
import { eq, and, sql, count } from "drizzle-orm";

export class AchievementService {
  async checkAndUpdateAchievements(userId: string) {
    try {
      const userAchievementsList = await storage.getUserAchievements(userId);
      
      for (const userAchievement of userAchievementsList) {
        if (userAchievement.isUnlocked) continue;
        
        const { achievement } = userAchievement;
        const requirement = achievement.requirement as any;
        
        let currentProgress = 0;
        
        switch (requirement.type) {
          case "challenges_completed":
            const completedChallenges = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(userChallengeProgress)
              .where(and(
                eq(userChallengeProgress.userId, userId),
                eq(userChallengeProgress.isCompleted, true)
              ));
            currentProgress = completedChallenges[0]?.count || 0;
            break;
            
          case "points_earned":
            const user = await storage.getUser(userId);
            currentProgress = user?.totalPoints || 0;
            break;
            
          case "level_reached":
            const userLevel = await storage.getUser(userId);
            currentProgress = userLevel?.level || 1;
            break;
            
          case "minigames_played":
            const miniGameCount = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(userMiniGameScores)
              .where(eq(userMiniGameScores.userId, userId));
            currentProgress = miniGameCount[0]?.count || 0;
            break;
            
          case "consecutive_days":
            // This would require more complex logic to track consecutive days
            // For now, we'll skip this type
            continue;
            
          default:
            continue;
        }
        
        // Update progress
        await storage.updateAchievementProgress(userId, achievement.id, currentProgress);
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
      throw error;
    }
  }

  async initializeDefaultAchievements() {
    try {
      const defaultAchievements = [
        {
          title: "První výzva",
          description: "Dokončil jsi svou první výzvu",
          icon: "fas fa-star",
          points: 500,
          category: "challenge",
          requirement: { type: "challenges_completed", target: 1 }
        },
        {
          title: "Hráčský veterán",
          description: "Hraj 7 dní v řadě",
          icon: "fas fa-gamepad",
          points: 300,
          category: "daily",
          requirement: { type: "consecutive_days", target: 7 }
        },
        {
          title: "Mistr výzev",
          description: "Dokončit 20 výzev",
          icon: "fas fa-target",
          points: 1000,
          category: "challenge",
          requirement: { type: "challenges_completed", target: 20 }
        },
        {
          title: "Sběratel bodů",
          description: "Získej 10,000 bodů",
          icon: "fas fa-coins",
          points: 800,
          category: "points",
          requirement: { type: "points_earned", target: 10000 }
        },
        {
          title: "Pokročilý hráč",
          description: "Dosáhni Level 25",
          icon: "fas fa-level-up-alt",
          points: 1200,
          category: "level",
          requirement: { type: "level_reached", target: 25 }
        },
        {
          title: "Mistr mini-her",
          description: "Zahraj si 50 mini-her",
          icon: "fas fa-gamepad",
          points: 600,
          category: "minigame",
          requirement: { type: "minigames_played", target: 50 }
        },
        {
          title: "Legenda",
          description: "Dosáhni Level 50",
          icon: "fas fa-crown",
          points: 2500,
          category: "level",
          requirement: { type: "level_reached", target: 50 }
        }
      ];

      for (const achievement of defaultAchievements) {
        try {
          await db.insert(achievements).values(achievement).onConflictDoNothing();
        } catch (error) {
          console.log("Achievement already exists:", achievement.title);
        }
      }

      console.log("Default achievements initialized successfully");
    } catch (error) {
      console.error("Error initializing default achievements:", error);
      throw error;
    }
  }
}

export const achievementService = new AchievementService();
