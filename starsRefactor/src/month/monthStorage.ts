import { Env } from "../types.js";

interface MonthlyData {
  [key: string]: number;
}

export class MonthStorage {
  constructor(private env: Env) {}
  
  /**
   * Retrieves cached data for a specific month
   * @param cacheKey The month cache key
   * @returns The cached monthly data or null if not found
   */
  async getCachedData(cacheKey: string): Promise<MonthlyData | null> {
    try {
      const cachedData = await this.env.GITHUB_STARS_CACHE.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error("Error retrieving cached month data:", error);
      return null;
    }
  }
  
  /**
   * Caches monthly data
   * @param cacheKey The month cache key
   * @param data The monthly data to cache
   * @param ttl Optional time-to-live in seconds
   */
  async cacheData(cacheKey: string, data: MonthlyData, ttl?: number): Promise<void> {
    try {
      const options = ttl ? { expirationTtl: ttl } : undefined;
      await this.env.GITHUB_STARS_CACHE.put(
        cacheKey, 
        JSON.stringify(data),
        options
      );
    } catch (error) {
      console.error("Error caching month data:", error);
      throw new Error("Failed to cache month data");
    }
  }
  
  /**
   * Deletes cached data for a specific month
   * @param cacheKey The month cache key to delete
   */
  async deleteCachedData(cacheKey: string): Promise<void> {
    try {
      await this.env.GITHUB_STARS_CACHE.delete(cacheKey);
    } catch (error) {
      console.error("Error deleting cached month data:", error);
      throw new Error("Failed to delete cached month data");
    }
  }
}