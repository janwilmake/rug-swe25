import { Env } from "../types.js";

export class DayStorage {
  constructor(private env: Env) {}
  
  /**
   * Retrieves cached data for a specific key
   * @param cacheKey The key to retrieve data for
   * @returns The cached data or null if not found
   */
  async getCachedData(cacheKey: string): Promise<any | null> {
    try {
      const cachedData = await this.env.GITHUB_STARS_CACHE.get(cacheKey);
      
      if (cachedData) {
        console.log(`[info] Retrieved cached data for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error("Error retrieving cached data:", error);
      return null;
    }
  }
  
  /**
   * Caches data for a specific key
   * @param cacheKey The key to store data under
   * @param data The data to cache
   * @param ttl Optional time-to-live in seconds
   */
  async cacheData(cacheKey: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      // Default TTL to 24 hours (86400 seconds) if not specified
      const options = { expirationTtl: ttl };
      await this.env.GITHUB_STARS_CACHE.put(
        cacheKey, 
        JSON.stringify(data),
        options
      );
      console.log(`[info] Successfully cached data for key: ${cacheKey} with TTL: ${ttl} seconds`);
    } catch (error) {
      console.error("Error caching data:", error);
      throw new Error("Failed to cache data");
    }
  }
  
  /**
   * Deletes cached data for a specific key
   * @param cacheKey The key to delete
   */
  async deleteCachedData(cacheKey: string): Promise<void> {
    try {
      await this.env.GITHUB_STARS_CACHE.delete(cacheKey);
    } catch (error) {
      console.error("Error deleting cached data:", error);
      throw new Error("Failed to delete cached data");
    }
  }
}