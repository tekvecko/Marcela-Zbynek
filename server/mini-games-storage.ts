import { db } from "./db";
import { miniGames, miniGameScores } from "../shared/schema";
import { eq } from "drizzle-orm";

export interface MiniGame {
  id: string;
  title: string;
  description: string;
  gameType: string;
  gameData: any;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface MiniGameScore {
  id: string;
  gameId: string;
  playerEmail: string;
  playerName: string;
  score: number;
  maxScore: number;
  timeSpent: number | null;
  gameData: any;
  createdAt: Date;
}

export interface InsertMiniGame {
  title: string;
  description: string;
  gameType: string;
  gameData: any;
  points?: number;
  timeLimit?: number | null;
  isActive?: boolean;
}

export interface InsertMiniGameScore {
  gameId: string;
  playerEmail: string;
  playerName: string;
  score: number;
  maxScore: number;
  timeSpent?: number | null;
  gameData?: any;
}

export class MiniGamesStorage {
  async getMiniGames(): Promise<MiniGame[]> {
    try {
      const games = await db.select().from(miniGames).where(eq(miniGames.isActive, true));
      return games;
    } catch (error) {
      console.error('Error fetching mini-games:', error);
      return [];
    }
  }

  async getMiniGame(id: string): Promise<MiniGame | undefined> {
    try {
      const [game] = await db.select().from(miniGames).where(eq(miniGames.id, id));
      return game;
    } catch (error) {
      console.error('Error fetching mini-game:', error);
      return undefined;
    }
  }

  async createMiniGame(game: InsertMiniGame): Promise<MiniGame> {
    const [newGame] = await db.insert(miniGames).values({
      title: game.title,
      description: game.description,
      gameType: game.gameType,
      gameData: game.gameData,
      points: game.points ?? 10,
      timeLimit: game.timeLimit ?? 60,
      isActive: game.isActive ?? true,
    }).returning();
    return newGame;
  }

  async saveMiniGameScore(score: InsertMiniGameScore): Promise<MiniGameScore> {
    const [newScore] = await db.insert(miniGameScores).values(score).returning();
    return newScore;
  }

  async getMiniGameScores(gameId: string): Promise<MiniGameScore[]> {
    try {
      const scores = await db
        .select()
        .from(miniGameScores)
        .where(eq(miniGameScores.gameId, gameId))
        .orderBy(miniGameScores.score);
      return scores;
    } catch (error) {
      console.error('Error fetching mini-game scores:', error);
      return [];
    }
  }

  async getPlayerScore(gameId: string, playerEmail: string): Promise<MiniGameScore | undefined> {
    try {
      const [score] = await db
        .select()
        .from(miniGameScores)
        .where(eq(miniGameScores.gameId, gameId))
        .where(eq(miniGameScores.playerEmail, playerEmail));
      return score;
    } catch (error) {
      console.error('Error fetching player score:', error);
      return undefined;
    }
  }

  async getTopScores(gameId: string, limit: number = 10): Promise<MiniGameScore[]> {
    try {
      const scores = await db
        .select()
        .from(miniGameScores)
        .where(eq(miniGameScores.gameId, gameId))
        .orderBy(miniGameScores.score)
        .limit(limit);
      return scores;
    } catch (error) {
      console.error('Error fetching top scores:', error);
      return [];
    }
  }
}

export const miniGamesStorage = new MiniGamesStorage();