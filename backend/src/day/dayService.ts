import { Env } from "../types.js";
import { DayStorage } from "./dayStorage.js";

interface DailyData {
  [key: string]: number;
}

export class DayService {
  private storage: DayStorage;

  constructor(private env: Env) {
    this.storage = new DayStorage(env);
  }

  async getDailyStars(date: string, limit?: number): Promise<DailyData> {
    const cacheKey = `v4-${date}`; // Updated cache key version for new API

    // Try to get cached data first
    const cachedData = await this.storage.getCachedData(cacheKey);
    if (cachedData) {
      return this.formatResponse(cachedData, limit);
    }

    // Fetch new data from the improved API
    const repoData = await this.fetchAndAggregateData(date);

    // If the API returned no data or failed, return empty object
    if (!repoData || Object.keys(repoData).length === 0) {
      console.warn(`No data available for ${date}`);
      //cache data anyways
      await this.storage.cacheData(cacheKey, {});
      return {};
    }

    // Sort data by stars count (descending) if not already sorted
    const sortedEntries = Object.entries(repoData).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    );

    // Create object from sorted entries
    const final = Object.fromEntries(sortedEntries);

    // Cache the results
    await this.storage.cacheData(cacheKey, final);

    // Format and return the result
    return this.formatResponse(final, limit);
  }

  private async fetchAndAggregateData(
    date: string
  ): Promise<Record<string, string | number>> {
    try {
      // Use the new API that provides daily data directly
      const url = `https://activity.forgithub.com/top100-starred-in-${date}.json`;

      console.log(`[info] Fetching data from: ${url}`);

      // Fetch data from the new API
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }

      // Parse the response
      const responseData: Record<string, string | number> =
        await response.json();

      console.log(`[info] Successfully fetched data for ${date}`);

      return responseData;
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      // In case of failure, return empty data instead of crashing
      return {};
    }
  }

  private formatResponse(
    data: Record<string, string | number>,
    limit?: number
  ): DailyData {
    // Filter out non-repository entries (date, total_repositories, timestamp)
    const repoEntries = Object.entries(data).filter(
      ([key]) => !isNaN(Number(key))
    );

    // Apply limit if specified
    const limitedEntries = limit ? repoEntries.slice(0, limit) : repoEntries;

    // Transform the format: swap repo and number, and invert numbering
    const totalRepos = limitedEntries.length;
    const result: DailyData = {};

    limitedEntries.forEach(([index, repoName], i) => {
      if (typeof repoName === 'string') {
        // Invert the numbering (if index 0, it gets the highest number)
        result[repoName.toLowerCase()] = totalRepos - i;
      }
    });

    return result;
  }
}