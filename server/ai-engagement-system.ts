
import { storage } from "./storage";

interface EngagementAction {
  userId: string;
  actionType: 'reminder' | 'reward' | 'challenge_suggestion' | 'social_nudge';
  message: string;
  priority: number;
  scheduledFor: Date;
}

export class AIEngagementSystem {
  
  async generateEngagementActions(): Promise<EngagementAction[]> {
    try {
      const behaviorLogs = await storage.getUserBehaviorLogs({ limit: 1000 });
      const actions: EngagementAction[] = [];
      const now = new Date();

      // Analýza neaktivních uživatelů
      const userActivity = behaviorLogs.reduce((acc, log) => {
        const daysSinceActivity = (now.getTime() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        
        if (!acc[log.userEmail] || daysSinceActivity < acc[log.userEmail].daysSinceLastActivity) {
          acc[log.userEmail] = {
            daysSinceLastActivity: daysSinceActivity,
            totalActions: (acc[log.userEmail]?.totalActions || 0) + 1,
            lastActionType: log.actionType
          };
        } else {
          acc[log.userEmail].totalActions += 1;
        }
        
        return acc;
      }, {} as any);

      // Generuj akce pro neaktivní uživatele
      Object.entries(userActivity).forEach(([email, data]: [string, any]) => {
        // Uživatelé neaktivní 3+ dny
        if (data.daysSinceLastActivity > 3 && data.daysSinceLastActivity < 7) {
          actions.push({
            userId: email,
            actionType: 'reminder',
            message: `Ahoj! Už ${Math.floor(data.daysSinceLastActivity)} dní jsi nenahrál žádnou fotku. Máme nové výzvy! 📸`,
            priority: 7,
            scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000) // Za 2 hodiny
          });
        }
        
        // Velmi aktivní uživatelé - odměna
        if (data.totalActions > 20 && data.daysSinceLastActivity < 1) {
          actions.push({
            userId: email,
            actionType: 'reward',
            message: `🌟 Jsi super aktivní! Máš už ${data.totalActions} akcí. Připravili jsme pro tebe speciální výzvu!`,
            priority: 9,
            scheduledFor: new Date(now.getTime() + 30 * 60 * 1000) // Za 30 minut
          });
        }
        
        // Uživatelé s jen uploadovými akcemi - sociální nudge
        const uploadActions = behaviorLogs.filter(log => 
          log.userEmail === email && log.actionType.includes('upload')
        ).length;
        const likeActions = behaviorLogs.filter(log => 
          log.userEmail === email && log.actionType === 'photo_like'
        ).length;
        
        if (uploadActions > 5 && likeActions === 0) {
          actions.push({
            userId: email,
            actionType: 'social_nudge',
            message: '❤️ Zkus lajknout fotky ostatních! Společně vytváříme krásné vzpomínky na svatbu.',
            priority: 5,
            scheduledFor: new Date(now.getTime() + 4 * 60 * 60 * 1000) // Za 4 hodiny
          });
        }
      });

      // Seřaď podle priority
      return actions.sort((a, b) => b.priority - a.priority).slice(0, 20); // Max 20 akcí
    } catch (error) {
      console.error('Error generating engagement actions:', error);
      return [];
    }
  }

  async scheduleOptimalUploadTimes(): Promise<{
    recommendations: Array<{
      timeSlot: string;
      expectedEngagement: number;
      reason: string;
    }>;
  }> {
    try {
      const behaviorLogs = await storage.getUserBehaviorLogs({ limit: 500 });
      
      // Analýza času nejvyšší aktivity
      const hourlyActivity = behaviorLogs.reduce((acc, log) => {
        const hour = new Date(log.createdAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as any);

      const peakHours = Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([hour, count]) => ({
          timeSlot: `${hour}:00 - ${parseInt(hour) + 1}:00`,
          expectedEngagement: (count as number) / behaviorLogs.length * 100,
          reason: count > 10 ? 'Nejvyšší aktivita uživatelů' : 'Střední aktivita'
        }));

      return { recommendations: peakHours };
    } catch (error) {
      console.error('Error analyzing optimal times:', error);
      return { recommendations: [] };
    }
  }
}

export const aiEngagementSystem = new AIEngagementSystem();
