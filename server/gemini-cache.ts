
interface CacheEntry {
  result: any;
  timestamp: number;
  hash: string;
}

class GeminiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minut
  private readonly MAX_SIZE = 100;

  private generateHash(imagePath: string, challengeTitle: string): string {
    return `${imagePath}-${challengeTitle}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50);
  }

  get(imagePath: string, challengeTitle: string): any | null {
    const hash = this.generateHash(imagePath, challengeTitle);
    const entry = this.cache.get(hash);
    
    if (!entry) return null;
    
    // Kontrola TTL
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(hash);
      return null;
    }
    
    console.log('🚀 Cache hit for Gemini verification');
    return entry.result;
  }

  set(imagePath: string, challengeTitle: string, result: any): void {
    const hash = this.generateHash(imagePath, challengeTitle);
    
    // Omezení velikosti cache
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      hash
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const geminiCache = new GeminiCache();
