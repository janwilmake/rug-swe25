import { Env } from "../types.js";

interface WeeklyData {
  weekNumber: string;
  startDate: string;
  endDate: string;
  repositories: {
    [key: string]: number;
  };
}

export class WeekStorage {
  constructor(private env: Env) {}
  
  /**
   * Retrieves cached data for a specific week
   * @param weekKey The week key in format YYYY-WXX
   * @returns The cached weekly data or null if not found
   */
  async getCachedData(weekKey: string): Promise<WeeklyData | null> {
    try {
      const cachedData = await this.env.GITHUB_STARS_CACHE.get(weekKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error("Error retrieving cached week data:", error);
      return null;
    }
  }
  
  /**
   * Caches weekly data
   * @param weekKey The week key in format YYYY-WXX
   * @param data The weekly data to cache
   * @param ttl Optional time-to-live in seconds
   */
  async cacheData(weekKey: string, data: WeeklyData, ttl?: number): Promise<void> {
    try {
      const options = ttl ? { expirationTtl: ttl } : undefined;
      await this.env.GITHUB_STARS_CACHE.put(
        weekKey, 
        JSON.stringify(data),
        options
      );
    } catch (error) {
      console.error("Error caching week data:", error);
      throw new Error("Failed to cache week data");
    }
  }
  
  /**
   * Deletes cached data for a specific week
   * @param weekKey The week key to delete
   */
  async deleteCachedData(weekKey: string): Promise<void> {
    try {
      await this.env.GITHUB_STARS_CACHE.delete(weekKey);
    } catch (error) {
      console.error("Error deleting cached week data:", error);
      throw new Error("Failed to delete cached week data");
    }
  }
}