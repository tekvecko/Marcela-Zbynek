
import { storage } from "./storage";

interface DifficultyAdjustment {
  challengeId: string;
  newPoints: number;
  reason: string;
  confidence: number;
}

export class AIDifficultyManager {
  
  async analyzeChallengePerformance(): Promise<DifficultyAdjustment[]> {
    try {
      const challenges = await storage.getQuestChallenges();
      const progressData = await storage.getQuestProgress();
      const adjustments: DifficultyAdjustment[] = [];

      for (const challenge of challenges) {
        const challengeProgress = progressData.filter(p => p.questId === challenge.id);
        
        if (challengeProgress.length < 5) continue; // Minimum 5 attempts needed
        
        const completionRate = challengeProgress.filter(p => p.isCompleted).length / challengeProgress.length;
        const avgPhotosNeeded = challengeProgress.reduce((sum, p) => sum + p.photosUploaded, 0) / challengeProgress.length;
        
        let adjustment: DifficultyAdjustment | null = null;

        // Příliš snadné výzvy (>80% úspěšnost)
        if (completionRate > 0.8 && avgPhotosNeeded < 1.5) {
          adjustment = {
            challengeId: challenge.id,
            newPoints: Math.min(50, challenge.points + 5),
            reason: `Výzva je příliš snadná (${(completionRate * 100).toFixed(1)}% úspěšnost)`,
            confidence: 0.9
          };
        }
        
        // Příliš těžké výzvy (<20% úspěšnost)
        else if (completionRate < 0.2 && avgPhotosNeeded > 3) {
          adjustment = {
            challengeId: challenge.id,
            newPoints: Math.max(5, challenge.points - 3),
            reason: `Výzva je příliš těžká (${(completionRate * 100).toFixed(1)}% úspěšnost)`,
            confidence: 0.85
          };
        }
        
        // Optimální obtížnost (40-60% úspěšnost)
        else if (completionRate >= 0.4 && completionRate <= 0.6) {
          adjustment = {
            challengeId: challenge.id,
            newPoints: challenge.points, // Ponechat současné body
            reason: `Výzva má optimální obtížnost (${(completionRate * 100).toFixed(1)}% úspěšnost)`,
            confidence: 0.95
          };
        }

        if (adjustment) {
          adjustments.push(adjustment);
        }
      }

      return adjustments;
    } catch (error) {
      console.error('Error analyzing challenge performance:', error);
      return [];
    }
  }

  async applyAutomaticAdjustments(): Promise<{
    applied: number;
    skipped: number;
    adjustments: DifficultyAdjustment[];
  }> {
    const adjustments = await this.analyzeChallengePerformance();
    let applied = 0;
    let skipped = 0;

    for (const adjustment of adjustments) {
      try {
        // Aplikuj pouze vysoce spolehlivé úpravy (>85% confidence)
        if (adjustment.confidence > 0.85 && adjustment.newPoints !== (await storage.getQuestChallenge(adjustment.challengeId))?.points) {
          const challenge = await storage.getQuestChallenge(adjustment.challengeId);
          if (challenge) {
            await storage.updateQuestChallenge(adjustment.challengeId, {
              ...challenge,
              points: adjustment.newPoints
            });
            applied++;
            console.log(`🤖 Auto-adjusted challenge ${challenge.title}: ${challenge.points} → ${adjustment.newPoints} points`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error applying adjustment for challenge ${adjustment.challengeId}:`, error);
        skipped++;
      }
    }

    return { applied, skipped, adjustments };
  }
}

export const aiDifficultyManager = new AIDifficultyManager();
